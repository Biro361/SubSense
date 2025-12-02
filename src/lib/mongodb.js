import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

// MongoDB Connection String aus Environment Variable
const uri = env.MONGODB_URI;

console.log('MongoDB URI vorhanden:', !!uri); // Debug-Log
console.log('MongoDB URI Länge:', uri?.length); // Debug-Log

if (!uri) {
	throw new Error('MONGODB_URI ist nicht in der .env Datei definiert');
}

const options = {};

let client;
let clientPromise;

if (import.meta.env.DEV) {
	// Development: Verwende globale Variable
	// @ts-ignore - globalThis wird zur Laufzeit erweitert
	if (!globalThis._mongoClientPromise) {
		client = new MongoClient(uri, options);
		// @ts-ignore
		globalThis._mongoClientPromise = client.connect();
	}
	// @ts-ignore
	clientPromise = globalThis._mongoClientPromise;
} else {
	// Production: Erstelle neuen Client
	client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

export default clientPromise;
