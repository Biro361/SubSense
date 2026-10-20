// src/routes/auth/signup/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { createUser } from '$lib/db/users';
import {
	recordAttempt,
	SIGNUP_IP_MAX_ATTEMPTS,
	SIGNUP_WINDOW_MINUTES
} from '$lib/db/rateLimit.js';
import { validatePassword } from '$lib/constants.js';
import { setSessionCookie } from '$lib/server/auth.js';

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const rawEmail = formData.get('email');
		const rawPassword = formData.get('password');
		const rawName = formData.get('name');

		const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
		const password = typeof rawPassword === 'string' ? rawPassword : '';
		const name = typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : undefined;

		// Grundvalidierung
		if (!email || !password) {
			return fail(400, { error: 'E-Mail und Passwort sind erforderlich.' });
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			return fail(400, { error: passwordError });
		}

		// Email-Format grob prüfen
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
		}

		try {
			// Vor createUser: der Passwort-Hash ist der teure Teil
			const [attempts] = await recordAttempt(
				[`signup:ip:${getClientAddress()}`],
				SIGNUP_WINDOW_MINUTES
			);

			if (attempts > SIGNUP_IP_MAX_ATTEMPTS) {
				return fail(429, {
					error: 'Zu viele Registrierungen. Bitte später erneut versuchen.'
				});
			}

			const userId = await createUser({ email, password, name });
			if (!userId) {
				return fail(400, { error: 'Diese E-Mail-Adresse ist bereits registriert.' });
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
