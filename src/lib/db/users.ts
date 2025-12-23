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
