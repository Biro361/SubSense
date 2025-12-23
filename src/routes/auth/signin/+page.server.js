// src/routes/auth/signin/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail } from '$lib/db/users';
import { setSessionCookie } from '../../../hooks.server.js';
import bcrypt from 'bcryptjs';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { error: 'Email und Passwort sind erforderlich.' });
		}

		try {
			const user = await getUserByEmail(email.toString());

			if (!user || !user.password) {
				return fail(401, { error: 'Email oder Passwort ist falsch.' });
			}

			const isValid = await bcrypt.compare(password.toString(), user.password);
			if (!isValid) {
				return fail(401, { error: 'Email oder Passwort ist falsch.' });
			}

			// Session-Cookie setzen
			setSessionCookie(cookies, user._id.toString(), user.email);

			// Erfolgreicher Login → Redirect
			throw redirect(303, '/');
		} catch (error) {
			// WICHTIG: Prüfen, ob es ein Redirect ist
			// SvelteKit wirft Redirects als Error-Objekte mit Status/Location
			if (error?.status === 303 || error instanceof Response) {
				throw error; // Redirect durchlassen!
			}

			console.error('Login error:', error);
			return fail(500, { error: 'Anmeldung fehlgeschlagen.' });
		}
	}
};
