// src/lib/mongodb.js
// @ts-check
import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

if (!MONGODB_URI) {
	throw new Error('MONGODB_URI is not defined');
}

const uri = MONGODB_URI;

/** @type {import('mongodb').MongoClientOptions} */
const options = {
	maxPoolSize: 1,
	minPoolSize: 0,
	serverSelectionTimeoutMS: 5000
};

/** @type {MongoClient} */
let client;

// Kein connect(): der Treiber verbindet beim ersten Zugriff selbst und versucht es
// nach einem Fehler erneut. Ein gespeichertes connect() bliebe für immer abgelehnt.
/** @type {Promise<MongoClient>} */
let clientPromise;

if (process.env.NODE_ENV === 'development') {
	// Development: Globales Caching
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri, options);
		global._mongoClientPromise = Promise.resolve(client);
	}
	clientPromise = global._mongoClientPromise;
} else {
	// Production: Neue Instanz
	client = new MongoClient(uri, options);
	clientPromise = Promise.resolve(client);
}

export default clientPromise;

/**
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDatabase() {
	const client = await clientPromise;
	return client.db('subsense');
}
