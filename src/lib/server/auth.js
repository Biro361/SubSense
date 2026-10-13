import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing');

// tokenVersion macht Sessions widerrufbar: hooks.server.js vergleicht sie mit der DB
export function signToken(userId, email, tokenVersion = 0) {
  return jwt.sign({ userId, email, tokenVersion }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Session-Cookie setzen
export function setSessionCookie(cookies, userId, email, tokenVersion = 0) {
	const token = signToken(userId, email, tokenVersion);
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
