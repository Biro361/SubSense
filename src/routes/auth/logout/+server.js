// src/routes/auth/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth.js';

/**
 * POST-Handler für Logout
 * Löscht die Session und leitet zur Landing-Page mit Erfolgsmeldung um.
 * Bewusst kein GET: sonst melden ein <img>, ein Prefetch oder ein fremder
 * Link den User ab. SvelteKit prüft bei POST zusätzlich den Origin-Header.
 */
export async function POST({ cookies }) {
	// Session-Cookie löschen
	clearSessionCookie(cookies);

	// Redirect zur Landing-Page mit Logout-Feedback
	throw redirect(303, '/?message=logged_out');
}
