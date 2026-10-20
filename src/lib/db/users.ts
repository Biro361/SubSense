// src/lib/db/users.ts
import { getDatabase } from '$lib/mongodb';
import { ObjectId, MongoServerError, type Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import { deleteAllContractDocuments } from '$lib/storage.js';

/** Einmal pro Prozess: ohne den Index sind doppelte Emails nicht verhindert */
let emailIndex: Promise<string> | null = null;

function ensureEmailIndex(db: Db): Promise<string> {
	// Fehlschlag nicht behalten: der nächste Request versucht es neu
	emailIndex ??= db.collection('users').createIndex({ email: 1 }, { unique: true }).catch((err) => {
		emailIndex = null;
		throw err;
	});
	return emailIndex;
}

export interface User {
	_id: ObjectId;
	email: string;
	password: string; // gehashter Wert
	name?: string;
	tokenVersion: number; // hochzählen = alle Sessions des Users verwerfen
	reminderEmails?: boolean; // fehlt bei Bestandskonten und gilt dann als an
	createdAt: Date;
	updatedAt: Date;
}

export interface NewUser {
	email: string;
	password: string;
	name?: string;
}

/**
 * Neuen User registrieren (mit gehashtem Passwort).
 * Gibt die neue User-ID zurück oder null, wenn Email schon existiert.
 */
export async function createUser(data: NewUser): Promise<ObjectId | null> {
	const db = await getDatabase();
	const { email, password, name } = data;

	await ensureEmailIndex(db);

	// Email normalisieren
	const normalizedEmail = email.toLowerCase();

	// Passwort hashen
	const hashedPassword = await bcrypt.hash(password, 10);
	const now = new Date();

	try {
		const result = await db.collection<User>('users').insertOne({
			email: normalizedEmail,
			password: hashedPassword,
			name: name || normalizedEmail.split('@')[0],
			tokenVersion: 0,
			createdAt: now,
			updatedAt: now
		});

		return result.insertedId;
	} catch (err) {
		// Der Index entscheidet, nicht ein vorheriges findOne: dazwischen passt ein Race
		if (err instanceof MongoServerError && err.code === 11000) {
			return null;
		}

		throw err;
	}
}

/**
 * User per Email laden (für spätere Erweiterungen).
 */
export async function getUserByEmail(email: string): Promise<User | null> {
	const db = await getDatabase();
	return db.collection<User>('users').findOne({
		email: email.toLowerCase()
	});
}

/**
 * User per ID laden.
 */
export async function getUserById(userId: string): Promise<User | null> {
	if (!ObjectId.isValid(userId)) return null;

	const db = await getDatabase();
	return db.collection<User>('users').findOne({
		_id: new ObjectId(userId)
	});
}

/**
 * Mehrere User in einer Abfrage laden, nur Adresse und Erinnerungs-Schalter.
 * Für den Erinnerungs-Lauf: ein findOne pro Vertrag wäre eine Abfrage pro Mail.
 */
export async function getUsersByIds(
	userIds: string[]
): Promise<Pick<User, '_id' | 'email' | 'reminderEmails'>[]> {
	const ids = userIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
	if (ids.length === 0) return [];

	const db = await getDatabase();
	return db
		.collection<User>('users')
		.find({ _id: { $in: ids } }, { projection: { email: 1, reminderEmails: 1 } })
		.toArray();
}

/**
 * E-Mail aktualisieren.
 * Gibt true zurück bei Erfolg, false wenn E-Mail bereits existiert.
 */
export async function updateUserEmail(
	userId: string,
	newEmail: string
): Promise<boolean> {
	if (!ObjectId.isValid(userId)) return false;

	const db = await getDatabase();
	await ensureEmailIndex(db);

	const normalizedEmail = newEmail.toLowerCase();

	try {
		await db.collection<User>('users').updateOne(
			{ _id: new ObjectId(userId) },
			{
				$set: {
					email: normalizedEmail,
					updatedAt: new Date()
				}
			}
		);

		return true;
	} catch (err) {
		// Email gehört einem anderen User
		if (err instanceof MongoServerError && err.code === 11000) {
			return false;
		}

		throw err;
	}
}

/**
 * Passwort aktualisieren.
 * Gibt true zurück bei Erfolg (altes Passwort korrekt), sonst false.
 */
export async function updateUserPassword(
	userId: string,
	oldPassword: string,
	newPassword: string
): Promise<boolean> {
	if (!ObjectId.isValid(userId)) return false;

	const db = await getDatabase();
	const user = await db.collection<User>('users').findOne({
		_id: new ObjectId(userId)
	});

	if (!user) {
		return false;
	}

	// Altes Passwort verifizieren
	const isValid = await bcrypt.compare(oldPassword, user.password);
	if (!isValid) {
		return false;
	}

	// Neues Passwort hashen
	const hashedPassword = await bcrypt.hash(newPassword, 10);

	await db.collection<User>('users').updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				password: hashedPassword,
				updatedAt: new Date()
			},
			// Alte Tokens entwerten: sie tragen die niedrigere Version
			$inc: { tokenVersion: 1 }
		}
	);

	return true;
}

/**
 * Name aktualisieren.
 */
export async function updateUserName(userId: string, name: string): Promise<void> {
	if (!ObjectId.isValid(userId)) return;

	const db = await getDatabase();
	await db.collection<User>('users').updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				name,
				updatedAt: new Date()
			}
		}
	);
}

/**
 * Erinnerungs-E-Mails ein- oder ausschalten.
 */
export async function updateReminderEmails(userId: string, enabled: boolean): Promise<void> {
	if (!ObjectId.isValid(userId)) return;

	const db = await getDatabase();
	await db.collection<User>('users').updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				reminderEmails: enabled,
				updatedAt: new Date()
			}
		}
	);
}

/**
 * User-Account löschen (inkl. aller zugehörigen Verträge).
 */
export async function deleteUser(userId: string): Promise<void> {
	if (!ObjectId.isValid(userId)) return;

	const db = await getDatabase();

	// Dateien zuerst: nach dem deleteMany sind die Vertrags-IDs nicht mehr auffindbar
	const contracts = await db
		.collection('contracts')
		.find({ userId }, { projection: { _id: 1 } })
		.toArray();

	await Promise.all(
		contracts.map((contract) => deleteAllContractDocuments(contract._id.toString()))
	);

	// userId liegt in contracts als String, nicht als ObjectId
	await db.collection('contracts').deleteMany({ userId });

	// Dann User löschen
	await db.collection<User>('users').deleteOne({
		_id: new ObjectId(userId)
	});
}
