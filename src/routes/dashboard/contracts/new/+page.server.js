import { fail, redirect } from '@sveltejs/kit';
import { createContract } from '$lib/db/contracts';
import { validateContract } from '$lib/validation.js';

// Form Action zum Erstellen eines Vertrags
export const actions = {
	default: async ({ request, locals }) => {
		// WICHTIG: User aus Session holen
		const user = locals.user;

		if (!user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}

		// Rohwerte: validateContract nimmt nur die bekannten Felder an
		const raw = Object.fromEntries(await request.formData());
		const { contract, errors, warnings } = validateContract(raw);

		// Im Formular wird nichts still ersetzt, die Warnungen gelten hier als Fehler
		if (!contract || warnings.length > 0) {
			return fail(400, { error: [...errors, ...warnings].join(' '), ...raw });
		}

		try {
			// WICHTIG: userId als zweiten Parameter übergeben
			await createContract(contract, user.userId);

			throw redirect(303, '/dashboard?message=created');

		} catch (error) {
			if (error.status === 303) throw error;

			console.error('Fehler beim Erstellen:', error);
			return fail(500, { error: 'Vertrag konnte nicht gespeichert werden', ...raw });
		}
	}
};
