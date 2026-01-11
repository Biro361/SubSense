// src/routes/profile/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import {
	getUserById,
	updateUserEmail,
	updateUserPassword,
	updateUserName,
	deleteUser
} from '$lib/db/users.js';
import { clearSessionCookie, setSessionCookie } from '$lib/server/auth.js';
import bcrypt from 'bcryptjs';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// Redirect zu Login, falls nicht eingeloggt
	if (!locals.user) {
		throw redirect(303, '/auth/signin');
	}

	// User-Daten laden
	const user = await getUserById(locals.user.userId);

	if (!user) {
		throw redirect(303, '/auth/signin');
	}

	return {
		user: {
			id: user._id.toString(),
			email: user.email,
			name: user.name,
			createdAt: user.createdAt
		}
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	// Action: Name aktualisieren
	updateName: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { error: 'Name darf nicht leer sein' });
		}

		await updateUserName(locals.user.userId, name.trim());

		return { success: true, message: 'Name erfolgreich aktualisiert' };
	},

	// Action: E-Mail aktualisieren
	updateEmail: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		const data = await request.formData();
		const email = data.get('email');

		// Validierung
		if (!email || typeof email !== 'string') {
			return fail(400, { error: 'Ungültige E-Mail' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Ungültiges E-Mail-Format' });
		}

		// E-Mail aktualisieren
		const success = await updateUserEmail(locals.user.userId, email);

		if (!success) {
			return fail(409, { error: 'Diese E-Mail wird bereits verwendet' });
		}

		// Neue Session mit aktualisierter E-Mail setzen
		setSessionCookie(cookies, locals.user.userId, email);

		return { success: true, message: 'E-Mail erfolgreich aktualisiert' };
	},

	// Action: Passwort ändern
	updatePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		const data = await request.formData();
		const oldPassword = data.get('oldPassword');
		const newPassword = data.get('newPassword');
		const confirmPassword = data.get('confirmPassword');

		// Validierung
		if (!oldPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'Alle Felder sind erforderlich' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwörter stimmen nicht überein' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'Neues Passwort muss mindestens 8 Zeichen haben' });
		}

		// Passwort aktualisieren
		const success = await updateUserPassword(locals.user.userId, oldPassword, newPassword);

		if (!success) {
			return fail(400, { error: 'Altes Passwort ist falsch' });
		}

		return { success: true, message: 'Passwort erfolgreich geändert' };
	},

	// Action: Account löschen
	deleteAccount: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		const data = await request.formData();
		const password = data.get('password');
		const confirmation = data.get('confirmation');

		// Validierung
		if (!password) {
			return fail(400, { error: 'Passwort erforderlich' });
		}

		if (confirmation !== 'LÖSCHEN') {
			return fail(400, { error: 'Bitte "LÖSCHEN" zur Bestätigung eingeben' });
		}

		// Passwort verifizieren
		const user = await getUserById(locals.user.userId);
		if (!user) {
			return fail(404, { error: 'User nicht gefunden' });
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return fail(400, { error: 'Falsches Passwort' });
		}

		// Account löschen
		await deleteUser(locals.user.userId);

		// Session löschen
		clearSessionCookie(cookies);

		// Redirect zur Startseite
		throw redirect(303, '/');
	}
};
