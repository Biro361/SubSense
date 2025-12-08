import { ObjectId } from 'mongodb';
import clientPromise from '$lib/mongodb';

const DB_NAME = 'subsense';
const COLLECTION_NAME = 'contracts';

/**
 * Alle Verträge abrufen
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
    
    // MongoDB ObjectIds in Strings konvertieren
    return contracts.map(contract => ({
      ...contract,
      _id: contract._id.toString()
    }));
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

/**
 * Einzelnen Vertrag nach ID abrufen
 */
export async function getContractById(id) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const contract = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    });
    
    if (!contract) return null;
    
    // MongoDB ObjectId in String konvertieren
    return {
      ...contract,
      _id: contract._id.toString()
    };
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

/**
 * Neuen Vertrag erstellen
 */
export async function createContract(contractData) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const result = await db.collection(COLLECTION_NAME).insertOne({
      ...contractData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      _id: result.insertedId.toString(),
      ...contractData
    };
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

/**
 * Vertrag aktualisieren
 */
export async function updateContract(id, updates) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
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
