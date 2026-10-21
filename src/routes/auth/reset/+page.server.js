// src/routes/auth/reset/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { consumePasswordReset } from '$lib/db/passwordResets.js';
import { resetUserPassword } from '$lib/db/users';
import { clearAttempts } from '$lib/db/rateLimit.js';
import { validatePassword } from '$lib/constants.js';

const INVALID_LINK = 'Dieser Link ist ungültig oder abgelaufen.';

/** @type {import('./$types').PageServerLoad} */
export function load({ url }) {
	// Nur weiterreichen, nicht einlösen: Mail-Programme rufen Links zur Vorschau per GET auf
	return { token: url.searchParams.get('token') ?? '' };
}

/** @param {FormDataEntryValue | null} value */
function text(value) {
	return typeof value === 'string' ? value : '';
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = text(formData.get('token'));
		const password = text(formData.get('password'));
		const passwordConfirm = text(formData.get('passwordConfirm'));

		if (!token) {
			return fail(400, { error: INVALID_LINK, invalidLink: true });
		}

		// Vor dem Einlösen prüfen: ein Tippfehler soll den Link nicht verbrauchen
		const passwordError = validatePassword(password);
		if (passwordError) {
			return fail(400, { error: passwordError, invalidLink: false });
		}
		if (password !== passwordConfirm) {
			return fail(400, { error: 'Die beiden Passwörter stimmen nicht überein.', invalidLink: false });
		}

		let email;
		try {
			const userId = await consumePasswordReset(token);
			email = userId ? await resetUserPassword(userId, password) : null;
			if (!email) {
				return fail(400, { error: INVALID_LINK, invalidLink: true });
			}
		} catch (error) {
			console.error('Password reset error:', error);
			// Das Token kann schon eingelöst sein: ein neuer Link ist der sichere Weg
			return fail(500, {
				error: 'Das Passwort konnte nicht gespeichert werden. Bitte fordere einen neuen Link an.',
				invalidLink: true
			});
		}

		try {
			// Wer sich mit falschen Passwörtern gesperrt hat, soll sich jetzt anmelden können.
			// Schlüssel wie in signin/+page.server.js; die Adresse ist dort und hier klein geschrieben.
			await clearAttempts([`login:mail:${email}`]);
		} catch (error) {
			// Das Passwort ist gesetzt: nur loggen, die Sperre läuft nach 15 Minuten ab
			console.error('Password reset limit error:', error);
		}

		throw redirect(303, '/auth/signin?message=password-reset');
	}
};
