// src/lib/server/auth.js
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

// Session-Cookie signieren
export function signToken(userId, email) {
	const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: '7d' });
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
