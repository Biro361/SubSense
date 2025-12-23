// src/routes/auth/signup/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { createUser } from '$lib/db/users';
import { setSessionCookie } from '$lib/server/auth.js';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const rawEmail = formData.get('email');
		const rawPassword = formData.get('password');
		const rawName = formData.get('name');

		const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
		const password = typeof rawPassword === 'string' ? rawPassword : '';
		const name = typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : undefined;

		// Grundvalidierung
		if (!email || !password) {
			return fail(400, { error: 'Email und Passwort sind erforderlich.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Passwort muss mindestens 6 Zeichen lang sein.' });
		}

		// Email-Format grob prüfen
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Bitte gib eine gültige Email-Adresse ein.' });
		}

		try {
			const userId = await createUser({ email, password, name });
			if (!userId) {
				return fail(400, { error: 'Diese Email-Adresse ist bereits registriert.' });
			}

			// Session-Cookie setzen (Auto-Login)
			setSessionCookie(cookies, userId, email);

			// Redirect zu Dashboard
			throw redirect(303, '/dashboard');
		} catch (error) {
			if (error?.status === 303) {
				throw error;
			}

			console.error('Registration error:', error);
			return fail(500, { error: 'Bei der Registrierung ist ein Fehler aufgetreten.' });
		}
	}
};
