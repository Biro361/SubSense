// src/lib/db/rateLimit.js
import { getDatabase } from '$lib/mongodb';

const COLLECTION_NAME = 'rate_limits';

// Grenzwerte für den Login; die Forgot-Password-Form nutzt eigene (5 pro Stunde)
export const LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_WINDOW_MINUTES = 15;

/**
 * Der Schlüssel ist die _id, deshalb ein eigener Dokumenttyp (Default wäre ObjectId)
 * @typedef {{ _id: string, attempts: number, expiresAt: Date }} RateLimitDoc
 */

/** Einmal pro Prozess: ohne den TTL-Index würden die Zähler nie ablaufen */
let ttlIndex = null;

async function getCollection() {
  const db = await getDatabase();
  const collection = /** @type {import('mongodb').Collection<RateLimitDoc>} */ (
    db.collection(COLLECTION_NAME)
  );

  // Fehlschlag nicht behalten: der nächste Request versucht es neu
  ttlIndex ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((err) => {
    ttlIndex = null;
    throw err;
  });
  await ttlIndex;

  return collection;
}

/**
 * Zählt einen Versuch auf allen Schlüsseln und gibt den höchsten Stand zurück.
 * Das Fenster startet beim ersten Versuch und wird durch weitere nicht verlängert.
 * @param {string[]} keys - z.B. ['login:ip:1.2.3.4', 'login:mail:a@b.c']
 * @param {number} windowMinutes - Lebensdauer des Zählers
 * @returns {Promise<number>} höchste Anzahl Versuche über alle Schlüssel
 */
export async function recordAttempt(keys, windowMinutes) {
  const collection = await getCollection();
  const expiresAt = new Date(Date.now() + windowMinutes * 60 * 1000);

  await collection.bulkWrite(
    keys.map((key) => ({
      updateOne: {
        filter: { _id: key },
        update: { $inc: { attempts: 1 }, $setOnInsert: { expiresAt } },
        upsert: true
      }
    }))
  );

  const counters = await collection
    .find({ _id: { $in: keys } }, { projection: { attempts: 1 } })
    .toArray();

  return Math.max(0, ...counters.map((counter) => counter.attempts ?? 0));
}

/**
 * Zähler zurücksetzen (nach erfolgreichem Login)
 * @param {string[]} keys
 */
export async function clearAttempts(keys) {
  const collection = await getCollection();
  await collection.deleteMany({ _id: { $in: keys } });
}
