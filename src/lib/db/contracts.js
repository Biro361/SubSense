import { ObjectId } from 'mongodb';
import clientPromise from '$lib/mongodb';

const DB_NAME = 'subsense';
const COLLECTION_NAME = 'contracts';

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
  
  // Ist der Vertrag dringend? (Erinnerungszeitraum erreicht und noch aktiv)
  const isUrgent = 
    contract.status === 'active' && 
    daysUntilCancellation <= reminderDays && 
    daysUntilCancellation >= 0;
  
  return {
    reminderDays,
    reminderDate,
    daysUntilCancellation,
    isUrgent
  };
}

/**
 * Alle Verträge abrufen (mit Erinnerungs-Metadaten)
 */
export async function getContracts() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const contracts = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ cancellationDate: 1 })
      .toArray();
    
    // MongoDB ObjectIds in Strings konvertieren + Erinnerungs-Metadaten hinzufügen
    return contracts.map(contract => {
      const metadata = calculateReminderMetadata(contract);
      
      return {
        ...contract,
        _id: contract._id.toString(),
        // Standardwerte für Abwärtskompatibilität
        cost: contract.cost ?? 0,
        billingCycle: contract.billingCycle ?? 'monthly',
        reminderDays: contract.reminderDays ?? 7,
        // Berechnete Felder
        ...metadata
      };
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

/**
 * Einzelnen Vertrag nach ID abrufen (mit Erinnerungs-Metadaten)
 */
export async function getContractById(id) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const contract = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    });
    
    if (!contract) return null;
    
    const metadata = calculateReminderMetadata(contract);
    
    // MongoDB ObjectId in String konvertieren
    return {
      ...contract,
      _id: contract._id.toString(),
      // Standardwerte für Abwärtskompatibilität
      cost: contract.cost ?? 0,
      billingCycle: contract.billingCycle ?? 'monthly',
      reminderDays: contract.reminderDays ?? 7,
      // Berechnete Felder
      ...metadata
    };
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

/**
 * Neuen Vertrag erstellen (mit Erinnerungseinstellung)
 */
export async function createContract(contractData) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    // Kostenfelder validieren und konvertieren
    const cost = parseFloat(contractData.cost) || 0;
    const billingCycle = contractData.billingCycle || 'monthly';
    const reminderDays = parseInt(contractData.reminderDays) || 7;
    
    // Validierung: Nur erlaubte Billing-Cycles
    if (!['monthly', 'yearly', 'quarterly'].includes(billingCycle)) {
      throw new Error('Invalid billing cycle');
    }
    
    // Validierung: Erinnerungstage müssen positiv sein
    if (reminderDays < 1 || reminderDays > 90) {
      throw new Error('Reminder days must be between 1 and 90');
    }
    
    const result = await db.collection(COLLECTION_NAME).insertOne({
      ...contractData,
      cost,
      billingCycle,
      reminderDays,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      _id: result.insertedId.toString(),
      ...contractData,
      cost,
      billingCycle,
      reminderDays
    };
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

/**
 * Vertrag aktualisieren (mit Erinnerungseinstellung)
 */
export async function updateContract(id, updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    // Kostenfelder validieren falls vorhanden
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
    
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
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
 * Vertrag löschen
 */
export async function deleteContract(id) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id)
    });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}

/**
 * Kostenstatistiken berechnen
 * Gibt Gesamtkosten (monatlich/jährlich) zurück
 */
export async function getCostStatistics() {
  const contracts = await getContracts();
  
  // Nur aktive Verträge berücksichtigen
  const activeContracts = contracts.filter(c => c.status === 'active');
  
  // Alle Kosten auf monatliche Basis normalisieren
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
 * Dringende Verträge abrufen (im Erinnerungszeitraum)
 */
export async function getUrgentContracts() {
  const allContracts = await getContracts();
  return allContracts.filter(contract => contract.isUrgent);
}
