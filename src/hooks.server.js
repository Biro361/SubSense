// src/hooks.server.js
import { redirect } from '@sveltejs/kit';
import { verifyToken, clearSessionCookie } from '$lib/server/auth.js';
import { getUserById } from '$lib/db/users.js';

// Haupthandle
export async function handle({ event, resolve }) {
	const pathname = event.url.pathname;

	// Session aus Cookie laden
	const sessionToken = event.cookies.get('session');
	if (sessionToken) {
		const payload = verifyToken(sessionToken);
		if (payload) {
			// Gegen die DB prüfen, nicht nur die Signatur: sonst gilt ein Token bis
			// zum Ablauf weiter, auch nach Passwortwechsel oder Account-Löschung
			const user = await getUserById(payload.userId);

			if (user && (user.tokenVersion ?? 0) === (payload.tokenVersion ?? 0)) {
				event.locals.user = {
					userId: payload.userId,
					email: payload.email,
					tokenVersion: user.tokenVersion ?? 0
				};
			} else {
				clearSessionCookie(event.cookies);
			}
		}
	}

	// Geschützte API-Routes
	const protectedPrefixes = ['/api'];
	const isProtected = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);

	// Redirect zu /auth/signin wenn nicht eingeloggt
	if (isProtected && !event.locals.user) {
		throw redirect(303, '/auth/signin');
	}

	return resolve(event);
}
