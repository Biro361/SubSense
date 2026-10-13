import { ObjectId } from 'mongodb';
import clientPromise from '$lib/mongodb';
import { validateContract } from '$lib/validation.js';
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
 * Alle Verträge eines Users abrufen (mit Erinnerungs-Metadaten)
 * @param {string} userId - Die ID des eingeloggten Users
 */
export async function getContracts(userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const contracts = await db
      .collection(COLLECTION_NAME)
      .find({ userId })
      .sort({ cancellationDate: 1 })
      .toArray();

    return contracts.map(contract => {
      const metadata = calculateReminderMetadata(contract);

      return {
        ...contract,
        _id: contract._id.toString(),
        cost: contract.cost ?? 0,
        billingCycle: contract.billingCycle ?? 'monthly',
        reminderDays: contract.reminderDays ?? 7,
        category: contract.category ?? 'other',
        cancellationUrl: contract.cancellationUrl ?? null,
        notes: contract.notes ?? '',
        cancellationInstructions: contract.cancellationInstructions ?? '',
        documents: normalizeDocuments(contract.documents),
        ...metadata
      };

    });
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

    const metadata = calculateReminderMetadata(contract);

    return {
      ...contract,
      _id: contract._id.toString(),
      cost: contract.cost ?? 0,
      billingCycle: contract.billingCycle ?? 'monthly',
      reminderDays: contract.reminderDays ?? 7,
      category: contract.category ?? 'other',
      cancellationUrl: contract.cancellationUrl ?? null,
      notes: contract.notes ?? '',
      cancellationInstructions: contract.cancellationInstructions ?? '',
      documents: normalizeDocuments(contract.documents),
      ...metadata
    };

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
 * Netlify-Function; ungültige Zeilen werden gemeldet, nicht geschrieben.
 * @param {Array<Record<string, unknown>>} contractsData
 * @param {string} userId
 * @returns {Promise<{ insertedCount: number, errors: string[] }>}
 */
export async function createContracts(contractsData, userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const now = new Date();
  /** @type {Record<string, unknown>[]} */
  const documents = [];
  /** @type {string[]} */
  const errors = [];

  contractsData.forEach((input, index) => {
    const { contract, errors: rowErrors } = validateContract(input);

    if (!contract) {
      const label = String(input.name ?? '').trim() || `Zeile ${index + 1}`;
      errors.push(`${label}: ${rowErrors.join(' ')}`);
      return;
    }

    documents.push({
      ...contract,
      userId,
      documents: [],
      createdAt: now,
      updatedAt: now
    });
  });

  if (documents.length === 0) {
    return { insertedCount: 0, errors };
  }

  try {
    // ordered: false - eine fehlerhafte Zeile stoppt die übrigen nicht
    const result = await db
      .collection(COLLECTION_NAME)
      .insertMany(documents, { ordered: false });

    return { insertedCount: result.insertedCount, errors };
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
    if (cancellationUrl && !/^https?:\/\/.+/.test(cancellationUrl)) {
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
