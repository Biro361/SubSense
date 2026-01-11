// src/lib/db/users.ts
import { getDatabase } from '$lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export interface User {
	_id: ObjectId;
	email: string;
	password: string; // gehashter Wert
	name?: string;
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

	// Email normalisieren
	const normalizedEmail = email.toLowerCase();

	// Prüfen, ob Email bereits existiert
	const existing = await db.collection<User>('users').findOne({
		email: normalizedEmail
	});

	if (existing) {
		return null;
	}

	// Passwort hashen
	const hashedPassword = await bcrypt.hash(password, 10);
	const now = new Date();

	const result = await db.collection<User>('users').insertOne({
		email: normalizedEmail,
		password: hashedPassword,
		name: name || normalizedEmail.split('@')[0],
		createdAt: now,
		updatedAt: now
	});

	return result.insertedId;
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
	const db = await getDatabase();
	return db.collection<User>('users').findOne({
		_id: new ObjectId(userId)
	});
}

/**
 * E-Mail aktualisieren.
 * Gibt true zurück bei Erfolg, false wenn E-Mail bereits existiert.
 */
export async function updateUserEmail(
	userId: string,
	newEmail: string
): Promise<boolean> {
	const db = await getDatabase();
	const normalizedEmail = newEmail.toLowerCase();

	// Prüfen, ob neue E-Mail bereits existiert (ausser beim aktuellen User)
	const existing = await db.collection<User>('users').findOne({
		email: normalizedEmail,
		_id: { $ne: new ObjectId(userId) }
	});

	if (existing) {
		return false;
	}

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
			}
		}
	);

	return true;
}

/**
 * Name aktualisieren.
 */
export async function updateUserName(userId: string, name: string): Promise<void> {
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
 * User-Account löschen (inkl. aller zugehörigen Verträge).
 */
export async function deleteUser(userId: string): Promise<void> {
	const db = await getDatabase();

	// Zuerst alle Verträge des Users löschen
	await db.collection('contracts').deleteMany({
		userId: new ObjectId(userId)
	});

	// Dann User löschen
	await db.collection<User>('users').deleteOne({
		_id: new ObjectId(userId)
	});
}
