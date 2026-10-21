// src/routes/auth/forgot/+page.server.js
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getUserByEmail } from '$lib/db/users';
import { createPasswordReset, RESET_TOKEN_MINUTES } from '$lib/db/passwordResets.js';
import {
	recordAttempt,
	RESET_MAX_REQUESTS,
	RESET_IP_MAX_REQUESTS,
	RESET_WINDOW_MINUTES,
	RESET_MAILS_MAX_PER_DAY,
	RESET_MAILS_MAX_PER_ACCOUNT,
	RESET_MAILS_WINDOW_MINUTES
} from '$lib/db/rateLimit.js';
import { sendMail, closeMail } from '$lib/server/mail';

// Jede Antwort dauert mindestens so lange. Nur für bestehende Konten geht eine Mail raus;
// ohne diese Streckung verriete die Antwortzeit, ob eine Adresse registriert ist.
// Unterstrich: SvelteKit erlaubt in +page.server.js sonst nur seine eigenen Exports
export const _MIN_RESPONSE_MS = 2000;

/**
 * @param {string} to
 * @param {string} link
 */
function buildResetMail(to, link) {
	const text = [
		'Hallo',
		'',
		'Du hast einen Link zum Zurücksetzen deines SubSense-Passworts angefordert:',
		link,
		'',
		`Der Link ist ${RESET_TOKEN_MINUTES} Minuten gültig und funktioniert nur einmal.`,
		'',
		'Falls du das nicht warst, ignoriere diese Mail. Dein Passwort bleibt unverändert.'
	].join('\n');

	return { to, subject: 'Passwort zurücksetzen – SubSense', text };
}

/**
 * Token anlegen und Mail verschicken, falls es das Konto gibt.
 * @param {string} email
 */
async function sendResetLink(email) {
	// Nicht aus dem Host-Header: ein gefälschter Host erzeugte Links auf eine fremde Domain
	const siteUrl = env.SITE_URL?.replace(/\/+$/, '');
	if (!siteUrl) {
		console.error('Password reset error: SITE_URL is missing');
		return;
	}

	const user = await getUserByEmail(email);
	if (!user) return;

	const userId = user._id.toString();

	// Erst hier zählen: Anfragen für unbekannte Adressen dürfen das Kontingent nicht aufbrauchen.
	// Getrennt und zuerst pro Konto: ein gesperrtes Konto zählt so nicht mehr aufs Limit aller.
	const [accountMailsToday] = await recordAttempt(
		[`reset:mails:user:${userId}`],
		RESET_MAILS_WINDOW_MINUTES
	);
	if (accountMailsToday > RESET_MAILS_MAX_PER_ACCOUNT) {
		console.error('Password reset error: daily mail limit per account reached');
		return;
	}

	const [mailsToday] = await recordAttempt(['reset:mails:all'], RESET_MAILS_WINDOW_MINUTES);
	if (mailsToday > RESET_MAILS_MAX_PER_DAY) {
		console.error('Password reset error: daily mail limit reached');
		return;
	}

	const token = await createPasswordReset(userId);
	try {
		// Abwarten: nach der Antwort friert Netlify die Function ein, die Mail ginge verloren
		const result = await sendMail(buildResetMail(user.email, `${siteUrl}/auth/reset?token=${token}`));
		// sendMail meldet fehlende Konfiguration nur einmal pro Prozess: hier jedes Mal, ohne Adresse
		if (result !== 'sent') console.error('Password reset mail not sent:', result);
	} finally {
		// Eine offene Verbindung wäre beim nächsten Aufruf der eingefrorenen Function tot
		closeMail();
	}
}

/** @param {number} started */
async function waitUntilMinimum(started) {
	const remaining = _MIN_RESPONSE_MS - (Date.now() - started);
	if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const started = Date.now();
		const formData = await request.formData();
		const rawEmail = formData.get('email');
		const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

		if (!email) {
			return fail(400, { email, error: 'Bitte gib deine E-Mail-Adresse ein.' });
		}

		try {
			const [ipAttempts, mailAttempts] = await recordAttempt(
				[`reset:ip:${getClientAddress()}`, `reset:mail:${email}`],
				RESET_WINDOW_MINUTES
			);

			// Ohne Streckung: das Limit greift für jede Adresse gleich, ob registriert oder nicht
			if (ipAttempts > RESET_IP_MAX_REQUESTS || mailAttempts > RESET_MAX_REQUESTS) {
				return fail(429, {
					email,
					error: `Zu viele Anfragen. Bitte in ${RESET_WINDOW_MINUTES} Minuten erneut versuchen.`
				});
			}
		} catch (error) {
			console.error('Password reset limit error:', error);
			return fail(500, { email, error: 'Anfrage fehlgeschlagen. Bitte später erneut versuchen.' });
		}

		try {
			await sendResetLink(email);
		} catch (error) {
			// Gleiche Antwort wie bei Erfolg: eine Fehlermeldung verriete, dass das Konto existiert
			console.error('Password reset error:', error);
		}

		await waitUntilMinimum(started);
		return { sent: true };
	}
};
