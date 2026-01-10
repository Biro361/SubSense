// src/routes/dashboard/+layout.server.js
import { redirect } from '@sveltejs/kit';

/**
 * Load-Funktion für Dashboard-Layout
 * Stellt sicher, dass User-Daten an alle Dashboard-Seiten weitergegeben werden
 */
export async function load({ locals }) {
	// Wenn kein User eingeloggt ist, zu /auth/signin umleiten
	// (sollte bereits durch hooks.server.js abgefangen werden, aber als Failsafe)
	if (!locals.user) {
		throw redirect(303, '/auth/signin');
	}

	// User-Daten an alle Dashboard-Child-Pages weitergeben
	return {
		user: locals.user
	};
}
