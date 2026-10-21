// src/lib/db/rateLimit.js
import { getDatabase } from '$lib/mongodb';

const COLLECTION_NAME = 'rate_limits';

// Grenzwerte für den Login
export const LOGIN_MAX_ATTEMPTS = 10;
// Höher als pro Email: hinter einem Campus-WLAN teilen sich viele User eine IP
export const LOGIN_IP_MAX_ATTEMPTS = 100;
export const LOGIN_WINDOW_MINUTES = 15;

export const SIGNUP_IP_MAX_ATTEMPTS = 20;
export const SIGNUP_WINDOW_MINUTES = 60;

// Reset-Mails teilen sich das Tageslimit von Infomaniak (200) mit den Erinnerungen
export const RESET_MAX_REQUESTS = 5;
export const RESET_IP_MAX_REQUESTS = 20;
export const RESET_WINDOW_MINUTES = 60;
// Über alle Adressen: der Erinnerungs-Lauf lässt 50 der 200 Mails frei, ein Ansturm auf
// Reset-Mails darf die Erinnerungen nicht verdrängen
export const RESET_MAILS_MAX_PER_DAY = 40;
// Pro Konto: sonst füllt ein einzelnes eigenes Konto mit 5 Anfragen pro Stunde das Limit aller
export const RESET_MAILS_MAX_PER_ACCOUNT = 3;
export const RESET_MAILS_WINDOW_MINUTES = 24 * 60;

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
 * Zählt einen Versuch auf allen Schlüsseln und gibt den Stand pro Schlüssel zurück.
 * Das Fenster startet beim ersten Versuch und wird durch weitere nicht verlängert.
 * @param {string[]} keys - z.B. ['login:ip:1.2.3.4', 'login:mail:a@b.c']
 * @param {number} windowMinutes - Lebensdauer des Zählers
 * @returns {Promise<number[]>} Anzahl Versuche, in der Reihenfolge von keys
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

  const byKey = new Map(counters.map((counter) => [counter._id, counter.attempts ?? 0]));
  return keys.map((key) => byKey.get(key) ?? 0);
}

/**
 * Zähler zurücksetzen (nach erfolgreichem Login)
 * @param {string[]} keys
 */
export async function clearAttempts(keys) {
  const collection = await getCollection();
  await collection.deleteMany({ _id: { $in: keys } });
}
