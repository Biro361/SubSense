// src/routes/dashboard/profile/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import {
	getUserById,
	updateUserEmail,
	updateUserPassword,
	updateUserName,
	updateReminderEmails,
	deleteUser
} from '$lib/db/users.js';
import { clearSessionCookie, setSessionCookie } from '$lib/server/auth.js';
import { validatePassword } from '$lib/constants.js';
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
			createdAt: user.createdAt,
			// Fehlendes Feld = an, Bestandskonten brauchen keine Migration
			reminderEmails: user.reminderEmails !== false
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
		setSessionCookie(cookies, locals.user.userId, email, locals.user.tokenVersion);

		return { success: true, message: 'E-Mail erfolgreich aktualisiert' };
	},

	// Action: Erinnerungs-E-Mails ein- oder ausschalten
	updateReminders: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		// Eine nicht angehakte Checkbox fehlt im Formular ganz: fehlt = aus
		const data = await request.formData();
		const enabled = data.get('reminderEmails') === 'on';

		await updateReminderEmails(locals.user.userId, enabled);

		return {
			success: true,
			message: enabled ? 'Erinnerungs-E-Mails eingeschaltet' : 'Erinnerungs-E-Mails ausgeschaltet'
		};
	},

	// Action: Passwort ändern
	updatePassword: async ({ request, locals, cookies }) => {
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

		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			return fail(400, { error: passwordError });
		}

		// Passwort aktualisieren
		const success = await updateUserPassword(locals.user.userId, oldPassword, newPassword);

		if (!success) {
			return fail(400, { error: 'Altes Passwort ist falsch' });
		}

		// Eigene Session nachziehen: updateUserPassword hat tokenVersion um 1 erhöht,
		// ohne das würde sich der eigene Browser beim nächsten Request abmelden
		setSessionCookie(
			cookies,
			locals.user.userId,
			locals.user.email,
			locals.user.tokenVersion + 1
		);

		return { success: true, message: 'Passwort erfolgreich geändert. Andere Geräte wurden abgemeldet.' };
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
