// src/hooks.server.js
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '$env/static/private';

// Session-Cookie signieren/verifizieren
function signToken(userId, email) {
	return jwt.sign({ userId, email }, AUTH_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
	try {
		return jwt.verify(token, AUTH_SECRET);
	} catch {
		return null;
	}
}

// Haupthandle
export async function handle({ event, resolve }) {
	const pathname = event.url.pathname;

	// Session aus Cookie laden
	const sessionToken = event.cookies.get('session');
	if (sessionToken) {
		const payload = verifyToken(sessionToken);
		if (payload) {
			event.locals.user = {
				id: payload.userId,
				email: payload.email
			};
		}
	}

	// Geschützte Routes
	const isAuthRoute = pathname.startsWith('/auth');
	const protectedPrefixes = ['/contracts', '/api'];
	const isProtected = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);

	// Redirect zu /auth/signin wenn nicht eingeloggt
	if (isProtected && !isAuthRoute && !event.locals.user) {
		throw redirect(303, '/auth/signin');
	}

	return resolve(event);
}

// Helper zum Setzen der Session (wird in +page.server.js genutzt)
export function setSessionCookie(cookies, userId, email) {
	const token = signToken(userId, email);
	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		secure: false, // Bei Production auf true setzen
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30 // 30 Tage
	});
}

export function clearSessionCookie(cookies) {
	cookies.delete('session', { path: '/' });
}
