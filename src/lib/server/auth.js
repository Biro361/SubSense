// src/lib/server/auth.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

// Session-Cookie signieren
export function signToken(userId, email) {
	return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
}

// Session-Cookie verifizieren
export function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch {
		return null;
	}
}

// Session-Cookie setzen
export function setSessionCookie(cookies, userId, email) {
	const token = signToken(userId, email);
	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30 // 30 Tage
	});
}

// Session-Cookie löschen
export function clearSessionCookie(cookies) {
	cookies.delete('session', { path: '/' });
}
