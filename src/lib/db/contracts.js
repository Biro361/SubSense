import clientPromise from '$lib/mongodb';
import { ObjectId } from 'mongodb';

// Datenbankname und Collection
const DB_NAME = 'subsense';
const COLLECTION = 'contracts';

/**
 * Alle Verträge aus der Datenbank abrufen
 */
export async function getContracts() {
	try {
		const client = await clientPromise;
		const db = client.db(DB_NAME);
		const contracts = await db
			.collection(COLLECTION)
			.find({})
			.sort({ cancellationDate: 1 }) // Sortiert nach Kündigungsdatum
			.toArray();
		
		return contracts;
	} catch (error) {
		console.error('Fehler beim Abrufen der Verträge:', error);
		throw error;
	}
}

/**
 * Einzelnen Vertrag anhand ID abrufen
 */
export async function getContractById(id) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  try {
    const contract = await db.collection(COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    });
    
    if (!contract) return null;
    
    // MongoDB ObjectId in String konvertieren für JSON-Serialisierung
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
	try {
		const client = await clientPromise;
		const db = client.db(DB_NAME);
		
		// Vertragsdaten mit Timestamp
		const contract = {
			...contractData,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		
		const result = await db.collection(COLLECTION).insertOne(contract);
		
		return {
			...contract,
			_id: result.insertedId
		};
	} catch (error) {
		console.error('Fehler beim Erstellen des Vertrags:', error);
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
    console.error('Fehler beim Aktualisieren des Vertrags:', error);
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


