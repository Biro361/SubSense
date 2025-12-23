// src/routes/auth/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth.js';

export async function GET({ cookies }) {
	// Session-Cookie löschen
	clearSessionCookie(cookies);

	// Redirect zur Landing-Page
	throw redirect(303, '/');
}
