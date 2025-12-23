// src/routes/dashboard/+layout.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Prüfen ob User eingeloggt ist
	if (!locals.user) {
		throw redirect(303, '/auth/signin');
	}

	// User-Daten an alle Dashboard-Seiten weitergeben
	return {
		user: locals.user
	};
}
