// src/routes/auth/signin/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail } from '$lib/db/users';
import {
	recordAttempt,
	clearAttempts,
	LOGIN_MAX_ATTEMPTS,
	LOGIN_IP_MAX_ATTEMPTS,
	LOGIN_WINDOW_MINUTES
} from '$lib/db/rateLimit.js';
import { setSessionCookie } from '$lib/server/auth.js';
import bcrypt from 'bcryptjs';

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { error: 'E-Mail und Passwort sind erforderlich.' });
		}

		// IP und Email getrennt zählen: sonst reicht ein Botnetz oder eine Wortliste
		const limitKeys = [
			`login:ip:${getClientAddress()}`,
			`login:mail:${email.toString().toLowerCase()}`
		];

		try {
			// Vor bcrypt prüfen: der Hash-Vergleich ist der teure Teil
			const [ipAttempts, mailAttempts] = await recordAttempt(limitKeys, LOGIN_WINDOW_MINUTES);

			if (ipAttempts > LOGIN_IP_MAX_ATTEMPTS || mailAttempts > LOGIN_MAX_ATTEMPTS) {
				return fail(429, {
					error: `Zu viele Anmeldeversuche. Bitte in ${LOGIN_WINDOW_MINUTES} Minuten erneut versuchen.`
				});
			}

			const user = await getUserByEmail(email.toString());

			if (!user || !user.password) {
				return fail(401, { error: 'E-Mail oder Passwort ist falsch.' });
			}

			const isValid = await bcrypt.compare(password.toString(), user.password);
			if (!isValid) {
				return fail(401, { error: 'E-Mail oder Passwort ist falsch.' });
			}

			// Nur den Email-Zähler: sonst setzt ein Login ins eigene Konto das IP-Limit zurück
			await clearAttempts([limitKeys[1]]);

			// Session-Cookie setzen
			setSessionCookie(cookies, user._id.toString(), user.email, user.tokenVersion);

			// Erfolgreicher Login → Redirect zu Dashboard
			throw redirect(303, '/dashboard');
		} catch (error) {
			// WICHTIG: Prüfen, ob es ein Redirect ist
			if (error?.status === 303 || error instanceof Response) {
				throw error; // Redirect durchlassen!
			}

			console.error('Login error:', error);
			return fail(500, { error: 'Anmeldung fehlgeschlagen.' });
		}
	}
};
