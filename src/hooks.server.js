// src/hooks.server.js
import { redirect } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth.js';

// Haupthandle
export async function handle({ event, resolve }) {
	const pathname = event.url.pathname;

	// Session aus Cookie laden
	const sessionToken = event.cookies.get('session');
	if (sessionToken) {
		const payload = verifyToken(sessionToken);
		if (payload) {
			event.locals.user = {
				userId: payload.userId,
				email: payload.email
			};
		}
	}

	// Auth-Routes prüfen
	const isAuthRoute = pathname.startsWith('/auth');

	// Geschützte API-Routes
	const protectedPrefixes = ['/api'];
	const isProtected = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);

	// Redirect zu /auth/signin wenn nicht eingeloggt
	if (isProtected && !isAuthRoute && !event.locals.user) {
		throw redirect(303, '/auth/signin');
	}

	return resolve(event);
}

// Re-export für Backwards-Kompatibilität
export { setSessionCookie, clearSessionCookie } from '$lib/server/auth.js';
