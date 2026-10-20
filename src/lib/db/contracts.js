import { ObjectId } from 'mongodb';
import clientPromise from '$lib/mongodb';
import { validateContract, URL_SHAPE } from '$lib/validation.js';
import { calculateReminderMetadata } from '$lib/reminders.js';

const DB_NAME = 'subsense';
const COLLECTION_NAME = 'contracts';


/**
 * Hilfsfunktion: Dokument-IDs zu Strings machen.
 * SvelteKit serialisiert load-Daten mit devalue, und devalue lehnt ObjectId ab:
 * ein Vertrag mit Dokument würde die Seite sonst mit einem 500er beenden.
 * @param {Array<Record<string, any>>} [documents]
 * @returns {Array<Record<string, any>>}
 */
function normalizeDocuments(documents) {
  return (documents ?? []).map((doc) => ({
    ...doc,
    _id: doc._id.toString()
  }));
}

/**
 * Die Form, in der ein gespeicherter Vertrag die Seiten erreicht:
 * ein validierter Vertrag plus String-ID, Dokumente und Erinnerungs-Metadaten.
 * @typedef {import('$lib/validation.js').ValidatedContract & {
 *   _id: string,
 *   documents: Record<string, any>[],
 *   reminderDate: Date,
 *   daysUntilCancellation: number,
 *   isUrgent: boolean,
 *   isOverdue: boolean,
 *   reminderSentAt?: Date
 * }} ContractView
 */

/**
 * Ein DB-Dokument in die Form bringen, die die Seiten erwarten.
 * Die Standardwerte decken Verträge ab, die vor einem Feld angelegt wurden.
 * @param {Record<string, any>} contract
 * @returns {ContractView}
 */
function normalize(contract) {
  return {
    ...contract,
    _id: contract._id.toString(),
    name: contract.name ?? '',
    provider: contract.provider ?? '',
    status: contract.status ?? 'active',
    cost: contract.cost ?? 0,
    billingCycle: contract.billingCycle ?? 'monthly',
    category: contract.category ?? 'other',
    cancellationUrl: contract.cancellationUrl ?? null,
    notes: contract.notes ?? '',
    cancellationInstructions: contract.cancellationInstructions ?? '',
    documents: normalizeDocuments(contract.documents),
    // reminderDays kommt aus den Metadaten, inklusive Standardwert
    ...calculateReminderMetadata(contract)
  };
}

/** Einmal pro Prozess: ohne den Index liest jedes Dashboard die Verträge aller User */
let userIndex = null;

function ensureUserIndex(db) {
  // Nur Tempo: ein Fehlschlag darf das Dashboard nicht stoppen
  userIndex ??= db
    .collection(COLLECTION_NAME)
    .createIndex({ userId: 1, cancellationDate: 1 })
    .catch((err) => {
      userIndex = null;
      console.error('Error creating contracts index:', err);
    });
  return userIndex;
}

/** Einmal pro Prozess: der Erinnerungs-Lauf sucht über alle User nach Status und Frist */
let reminderIndex = null;

/** @param {import('mongodb').Db} db */
function ensureReminderIndex(db) {
  // Nur Tempo: ein Fehlschlag darf den Erinnerungs-Lauf nicht stoppen
  reminderIndex ??= db
    .collection(COLLECTION_NAME)
    .createIndex({ status: 1, cancellationDate: 1 })
    .catch((err) => {
      reminderIndex = null;
      console.error('Error creating reminder index:', err);
    });
  return reminderIndex;
}

/**
 * Aktive Verträge ALLER User, deren Frist im Fenster liegt und die noch keine
 * Erinnerung bekommen haben.
 * ACHTUNG: einzige Abfrage ohne userId-Filter. Nur für den Erinnerungs-Endpoint
 * (src/routes/internal/send-reminders), der den geheimen Schlüssel prüft.
 * @param {Date} fromDate - heutiger Kalendertag als UTC-Mitternacht
 * @param {number} days - Fensterlänge in Tagen (maximales reminderDays)
 * @returns {Promise<Array<ContractView & { userId: string }>>}
 */
export async function getContractsWithUpcomingDeadlines(fromDate, days) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const until = new Date(fromDate.getTime() + days * 24 * 60 * 60 * 1000);

  try {
    await ensureReminderIndex(db);

    const contracts = await db
      .collection(COLLECTION_NAME)
      .find(
        {
          // null trifft auch Altbestand ohne Status, der als aktiv gilt
          status: { $in: ['active', null] },
          cancellationDate: { $gte: fromDate, $lte: until },
          reminderSentAt: null
        },
        {
          // Nur was die Mail braucht: Notizen und Dokumente bleiben in der DB
          projection: {
            userId: 1,
            name: 1,
            provider: 1,
            status: 1,
            cancellationDate: 1,
            reminderDays: 1,
            cancellationUrl: 1
          }
        }
      )
      .toArray();

    return contracts.map((contract) => ({ ...normalize(contract), userId: contract.userId }));
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    throw error;
  }
}

/**
 * Erinnerung als verschickt markieren. Nur nach erfolgreichem Versand aufrufen,
 * sonst geht die Erinnerung bei einem Mail-Ausfall verloren.
 * Ohne userId-Filter: nur für den Erinnerungs-Endpoint.
 * @param {string} contractId
 * @param {Date} sentAt
 * @param {Date} cancellationDate - die Frist, zu der die Mail ging
 * @returns {Promise<boolean>}
 */
export async function markReminderSent(contractId, sentAt, cancellationDate) {
  if (!ObjectId.isValid(contractId)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    // Bedingung auf null: ein paralleler Lauf überschreibt den ersten Zeitpunkt nicht.
    // Bedingung auf die Frist: hat der User sie während des Laufs geändert, gehört die
    // Markierung nicht zur neuen Frist, die ihre eigene Erinnerung bekommen soll.
    // updatedAt bleibt, es zeigt die letzte Änderung durch den User.
    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(contractId), cancellationDate, reminderSentAt: null },
        { $set: { reminderSentAt: sentAt } }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking reminder sent:', error);
    throw error;
  }
}

/**
 * Alle Verträge eines Users abrufen (mit Erinnerungs-Metadaten)
 * @param {string} userId - Die ID des eingeloggten Users
 */
export async function getContracts(userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    await ensureUserIndex(db);

    const contracts = await db
      .collection(COLLECTION_NAME)
      .find({ userId })
      .sort({ cancellationDate: 1 })
      .toArray();

    return contracts.map(normalize);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

/**
 * Einzelnen Vertrag nach ID abrufen (mit User-Check)
 * @param {string} id - Contract ID
 * @param {string} userId - User ID (für Sicherheitscheck)
 */
export async function getContractById(id, userId) {
  if (!ObjectId.isValid(id)) return null;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const contract = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(id),
      userId
    });

    if (!contract) return null;

    return normalize(contract);

  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

/**
 * Neuen Vertrag erstellen (mit userId)
 * @param {object} contractData - Vertragsdaten
 * @param {string} userId - ID des erstellenden Users
 */
export async function createContract(contractData, userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const { contract, errors } = validateContract(contractData);
    if (!contract) {
      throw new Error(errors.join(' '));
    }

    const result = await db.collection(COLLECTION_NAME).insertOne({
      ...contract,
      userId,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      _id: result.insertedId.toString(),
      ...contract,
      userId,
      documents: []
    };

  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

/**
 * Mehrere Verträge in einem Schreibvorgang anlegen (CSV-Import).
 * Ein insertOne pro Zeile sprengt bei grösseren Dateien das Zeitlimit der
 * Netlify-Function. Ungültige Zeilen sortiert parseCSV vorher aus; kommt hier
 * trotzdem eine an, wird wie in createContract nichts geschrieben.
 * @param {Array<Record<string, unknown>>} contractsData
 * @param {string} userId
 * @returns {Promise<number>} Anzahl geschriebener Verträge
 */
export async function createContracts(contractsData, userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const now = new Date();
  const documents = contractsData.map((input) => {
    const { contract, errors } = validateContract(input);
    if (!contract) {
      throw new Error(errors.join(' '));
    }

    return {
      ...contract,
      userId,
      documents: [],
      createdAt: now,
      updatedAt: now
    };
  });

  // insertMany wirft bei einer leeren Liste
  if (documents.length === 0) {
    return 0;
  }

  try {
    // ordered: false - eine fehlerhafte Zeile stoppt die übrigen nicht
    const result = await db
      .collection(COLLECTION_NAME)
      .insertMany(documents, { ordered: false });

    return result.insertedCount;
  } catch (error) {
    console.error('Error creating contracts:', error);
    throw error;
  }
}

/**
 * Vertrag aktualisieren (mit User-Check)
 * @param {string} id - Contract ID
 * @param {object} updates - Zu aktualisierende Felder
 * @param {string} userId - User ID (Security)
 */
export async function updateContract(id, updates, userId) {
  if (!ObjectId.isValid(id)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const { contract, errors } = validateContract(updates);
    if (!contract) {
      throw new Error(errors.join(' '));
    }

    // Neue Frist oder neuer Vorlauf = neue Erinnerung. Vor dem $set, weil danach
    // der alte Wert fehlt; scheitert das $set, kommt höchstens eine Mail doppelt.
    await db.collection(COLLECTION_NAME).updateOne(
      {
        _id: new ObjectId(id),
        userId,
        $or: [
          { cancellationDate: { $ne: contract.cancellationDate } },
          { reminderDays: { $ne: contract.reminderDays } }
        ]
      },
      { $unset: { reminderSentAt: '' } }
    );

    // Nur die editierbaren Felder: notes, cancellationInstructions und documents
    // haben eigene Funktionen und dürfen hier nicht überschrieben werden
    const result = await db.collection(COLLECTION_NAME).updateOne(
      {
        _id: new ObjectId(id),
        userId
      },
      {
        $set: {
          name: contract.name,
          provider: contract.provider,
          cancellationDate: contract.cancellationDate,
          status: contract.status,
          cost: contract.cost,
          billingCycle: contract.billingCycle,
          reminderDays: contract.reminderDays,
          category: contract.category,
          cancellationUrl: contract.cancellationUrl,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
}

/**
 * Vertrag löschen (mit User-Check)
 * @param {string} id - Contract ID
 * @param {string} userId - User ID (Security)
 */
export async function deleteContract(id, userId) {
  if (!ObjectId.isValid(id)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id),
      userId
    });

    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}

// ========================================
// NEU: Erweiterte Funktionen für Detailansicht
// ========================================

/**
 * Notizen zu einem Vertrag hinzufügen/aktualisieren
 * @param {string} contractId - Vertrags-ID
 * @param {string} notes - Notiztext
 * @param {string} userId - User ID (Security)
 */
export async function updateNotes(contractId, notes, userId) {
  if (!ObjectId.isValid(contractId)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { 
        _id: new ObjectId(contractId),
        userId 
      },
      { 
        $set: { 
          notes: notes || '',
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating notes:', error);
    throw error;
  }
}

/**
 * Kündigungsanweisungen zu einem Vertrag hinzufügen/aktualisieren
 * @param {string} contractId - Vertrags-ID
 * @param {string} instructions - Kündigungsanweisungen
 * @param {string} url - URL zur Kündigungsseite (optional)
 * @param {string} userId - User ID (Security)
 */
export async function updateCancellationInstructions(contractId, instructions, url, userId) {
  if (!ObjectId.isValid(contractId)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    // URL validieren falls vorhanden
    const cancellationUrl = url?.trim() || null;
    if (cancellationUrl && !URL_SHAPE.test(cancellationUrl)) {
      throw new Error('Invalid cancellation URL format');
    }

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { 
        _id: new ObjectId(contractId),
        userId 
      },
      { 
        $set: { 
          cancellationInstructions: instructions || '',
          cancellationUrl,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating cancellation instructions:', error);
    throw error;
  }
}

/**
 * Dokument zu einem Vertrag hinzufügen
 * @param {string} contractId - Vertrags-ID
 * @param {object} documentData - Dokument-Metadaten
 * @param {string} userId - User ID (Security)
 */
export async function addDocument(contractId, documentData, userId) {
  if (!ObjectId.isValid(contractId)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { 
        _id: new ObjectId(contractId),
        userId 
      },
      { 
        $push: { 
          documents: {
            _id: new ObjectId(),
            ...documentData,
            uploadDate: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

/**
 * Dokument aus einem Vertrag löschen
 * @param {string} contractId - Vertrags-ID
 * @param {string} documentId - Dokument-ID
 * @param {string} userId - User ID (Security)
 */
export async function removeDocument(contractId, documentId, userId) {
  if (!ObjectId.isValid(contractId) || !ObjectId.isValid(documentId)) return false;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { 
        _id: new ObjectId(contractId),
        userId 
      },
      { 
        $pull: { 
          documents: { _id: new ObjectId(documentId) } 
        },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error removing document:', error);
    throw error;
  }
}
