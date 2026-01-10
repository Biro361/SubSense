import { ObjectId } from 'mongodb';
import clientPromise from '$lib/mongodb';
import { VALID_CATEGORIES } from '$lib/constants';

const DB_NAME = 'subsense';
const COLLECTION_NAME = 'contracts';


/**
 * Hilfsfunktion: Berechnet Erinnerungs-Metadaten für einen Vertrag
 */
/**
 * Hilfsfunktion: Berechnet Erinnerungs-Metadaten für einen Vertrag
 */
function calculateReminderMetadata(contract) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cancellationDate = new Date(contract.cancellationDate);
  cancellationDate.setHours(0, 0, 0, 0);

  // Tage bis zur Kündigungsfrist berechnen
  const daysUntilCancellation = Math.ceil(
    (cancellationDate - today) / (1000 * 60 * 60 * 24)
  );

  // Erinnerungstage (Standard: 7 Tage vor Kündigungsfrist)
  const reminderDays = contract.reminderDays ?? 7;

  // Erinnerungsdatum berechnen
  const reminderDate = new Date(cancellationDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);

  // Status-Berechnung
  const isOverdue =
    contract.status === 'active' &&
    daysUntilCancellation < 0; // Kündigungsfrist bereits verpasst

  const isUrgent =
    contract.status === 'active' &&
    daysUntilCancellation <= reminderDays &&
    daysUntilCancellation >= 0; // Im Erinnerungszeitraum, aber noch nicht überfällig

  return {
    reminderDays,
    reminderDate,
    daysUntilCancellation,
    isUrgent,
    isOverdue // NEU: Kennzeichnung für verpasste Fristen
  };
}


/**
 * Alle Verträge eines Users abrufen (mit Erinnerungs-Metadaten)
 * @param {string} userId - Die ID des eingeloggten Users
 */
export async function getContracts(userId) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    // WICHTIG: Nach userId filtern
    const contracts = await db
      .collection(COLLECTION_NAME)
      .find({ userId }) // ← NEU: Nur Verträge dieses Users
      .sort({ cancellationDate: 1 })
      .toArray();

    // Rest bleibt gleich
    return contracts.map(contract => {
      const metadata = calculateReminderMetadata(contract);

      return {
        ...contract,
        _id: contract._id.toString(),
        cost: contract.cost ?? 0,
        billingCycle: contract.billingCycle ?? 'monthly',
        reminderDays: contract.reminderDays ?? 7,
        category: contract.category ?? 'other',
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
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    // WICHTIG: Nach ID UND userId suchen (Security!)
    const contract = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(id),
      userId // ← NEU: User muss Besitzer sein
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
    const cost = parseFloat(contractData.cost) || 0;
    const billingCycle = contractData.billingCycle || 'monthly';
    const reminderDays = parseInt(contractData.reminderDays) || 7;

    // ✅ NEU: Kategorie-Validierung
    const category = contractData.category || 'other';
    if (!VALID_CATEGORIES.includes(category)) {
      throw new Error('Invalid category');
    }

    if (!['monthly', 'yearly', 'quarterly'].includes(billingCycle)) {
      throw new Error('Invalid billing cycle');
    }


    if (reminderDays < 1 || reminderDays > 90) {
      throw new Error('Reminder days must be between 1 and 90');
    }

    const result = await db.collection(COLLECTION_NAME).insertOne({
      ...contractData,
      userId,
      cost,
      billingCycle,
      reminderDays,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    });


    return {
      _id: result.insertedId.toString(),
      ...contractData,
      userId,
      cost,
      billingCycle,
      reminderDays,
      category
    };

  } catch (error) {
    console.error('Error creating contract:', error);
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
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    const updateData = { ...updates };

    if (updates.cost !== undefined) {
      updateData.cost = parseFloat(updates.cost) || 0;
    }

    if (updates.billingCycle !== undefined) {
      if (!['monthly', 'yearly', 'quarterly'].includes(updates.billingCycle)) {
        throw new Error('Invalid billing cycle');
      }
      updateData.billingCycle = updates.billingCycle;
    }

    if (updates.reminderDays !== undefined) {
      const reminderDays = parseInt(updates.reminderDays);
      if (reminderDays < 1 || reminderDays > 90) {
        throw new Error('Reminder days must be between 1 and 90');
      }
      updateData.reminderDays = reminderDays;
    }

    // Kategorie-Validierung
    if (updates.category !== undefined) {
      if (!VALID_CATEGORIES.includes(updates.category)) {
        throw new Error('Invalid category');
      }
      updateData.category = updates.category;
    }


    // WICHTIG: Nur updaten wenn User = Besitzer
    const result = await db.collection(COLLECTION_NAME).updateOne(
      {
        _id: new ObjectId(id),
        userId // ← NEU: Security-Check
      },
      {
        $set: {
          ...updateData,
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
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  try {
    // WICHTIG: Nur löschen wenn User = Besitzer
    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id),
      userId // ← NEU: Security-Check
    });

    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}

/**
 * Kostenstatistiken für einen User berechnen
 * @param {string} userId - User ID
 */
export async function getCostStatistics(userId) {
  const contracts = await getContracts(userId); // ← NEU: userId übergeben

  const activeContracts = contracts.filter(c => c.status === 'active');

  const totalMonthlyCost = activeContracts.reduce((sum, contract) => {
    const cost = contract.cost || 0;
    const cycle = contract.billingCycle || 'monthly';

    let monthlyCost = cost;
    if (cycle === 'yearly') monthlyCost = cost / 12;
    if (cycle === 'quarterly') monthlyCost = cost / 3;

    return sum + monthlyCost;
  }, 0);

  return {
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    totalYearlyCost: Math.round(totalMonthlyCost * 12 * 100) / 100,
    activeContractsCount: activeContracts.length,
    totalContractsCount: contracts.length
  };
}

/**
 * Dringende Verträge eines Users abrufen
 * @param {string} userId - User ID
 */
export async function getUrgentContracts(userId) {
  const allContracts = await getContracts(userId); // ← NEU: userId übergeben
  return allContracts.filter(contract => contract.isUrgent);
}