// src/routes/auth/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth.js';

/**
 * GET-Handler für Logout
 * Löscht die Session und leitet zur Landing-Page mit Erfolgsmeldung um
 */
export async function GET({ cookies }) {
	// Session-Cookie löschen
	clearSessionCookie(cookies);

	// Redirect zur Landing-Page mit Logout-Feedback
	throw redirect(303, '/?message=logged_out');
}
