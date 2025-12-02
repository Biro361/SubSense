import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

const uri = env.MONGODB_URI;
const options = {
    // Optimierungen für Serverless
    maxPoolSize: 1,          // Maximal 1 Verbindung pro Function-Instanz
    minPoolSize: 0,
    connectTimeoutMS: 5000,  // Schnellerer Timeout beim Verbinden
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

if (!uri) {
    throw new Error('Please add your Mongo URI to .env');
}

if (process.env.NODE_ENV === 'development') {
    // Im Dev-Modus globale Variable nutzen
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // Im Production-Modus (Netlify)
    // WICHTIG: Variable außerhalb des Handlers definieren für Wiederverwendung (Connection Pooling)
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}

export default clientPromise;
