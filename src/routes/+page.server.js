// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Eingeloggte User direkt zu Dashboard umleiten
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}

	// Nicht eingeloggte User sehen die Landing-Page
	return {
		user: null
	};
}
