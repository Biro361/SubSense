// src/lib/db/passwordResets.js
import { randomBytes, createHash } from 'node:crypto';
import { getDatabase } from '$lib/mongodb';

const COLLECTION_NAME = 'password_resets';

// So lange gilt ein Link aus der Mail
export const RESET_TOKEN_MINUTES = 30;

/**
 * Ein offener Reset pro User. Gespeichert wird nur der Hash: das Token wirkt wie ein Passwort.
 * @typedef {{ userId: string, tokenHash: string, expiresAt: Date, createdAt: Date }} PasswordResetDoc
 */

/** Einmal pro Prozess: ohne den TTL-Index blieben abgelaufene Tokens liegen */
let ttlIndex = null;

async function getCollection() {
  const db = await getDatabase();
  const collection = /** @type {import('mongodb').Collection<PasswordResetDoc>} */ (
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
 * SHA-256 reicht: das Token hat volle Zufallsentropie, ein Wörterbuch hilft nicht
 * @param {string} token
 */
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Neues Reset-Token anlegen. Ein offenes älteres Token desselben Users verfällt damit.
 * @param {string} userId
 * @returns {Promise<string>} Klartext-Token für den Link (wird nirgends gespeichert)
 */
export async function createPasswordReset(userId) {
  const collection = await getCollection();
  const token = randomBytes(32).toString('base64url');
  const now = new Date();

  // Ersetzen statt einfügen: nur der neueste Link gilt
  await collection.replaceOne(
    { userId },
    {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + RESET_TOKEN_MINUTES * 60 * 1000),
      createdAt: now
    },
    { upsert: true }
  );

  return token;
}

/**
 * Offene Reset-Tokens eines Users verwerfen. Nach Änderung von Adresse oder Passwort darf
 * ein Link im alten Postfach nicht mehr gelten.
 * @param {string} userId
 */
export async function deletePasswordResets(userId) {
  const collection = await getCollection();
  await collection.deleteMany({ userId });
}

/**
 * Token einlösen. Gelingt nur einmal und nur vor dem Ablauf.
 * @param {string} token
 * @returns {Promise<string | null>} userId oder null
 */
export async function consumePasswordReset(token) {
  if (typeof token !== 'string' || token.length === 0) return null;

  const collection = await getCollection();
  // Finden und löschen in einem Schritt: zwei parallele Requests lösen es nicht beide ein.
  // Ablauf hier prüfen, der TTL-Index räumt nur etwa minütlich auf.
  const doc = await collection.findOneAndDelete({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  });

  return doc?.userId ?? null;
}
