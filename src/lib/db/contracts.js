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
	try {
		const client = await clientPromise;
		const db = client.db(DB_NAME);
		const contract = await db
			.collection(COLLECTION)
			.findOne({ _id: new ObjectId(id) });
		
		return contract;
	} catch (error) {
		console.error('Fehler beim Abrufen des Vertrags:', error);
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
	try {
		const client = await clientPromise;
		const db = client.db(DB_NAME);
		
		const result = await db.collection(COLLECTION).updateOne(
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
	try {
		const client = await clientPromise;
		const db = client.db(DB_NAME);
		
		const result = await db
			.collection(COLLECTION)
			.deleteOne({ _id: new ObjectId(id) });
		
		return result.deletedCount > 0;
	} catch (error) {
		console.error('Fehler beim Löschen des Vertrags:', error);
		throw error;
	}
}
