// src/routes/dashboard/+page.server.js
import { getContracts } from '$lib/db/contracts';

// Lädt alle Verträge beim Seitenaufruf (gefiltert nach User)
export async function load({ locals }) {
	// User aus Session holen (via hooks.server.js)
	const user = locals.user;

	// Falls kein User, sollte Hook bereits umgeleitet haben
	if (!user) {
		return { contracts: [], error: 'Nicht eingeloggt' };
	}

	try {
		// getContracts liefert daysUntilCancellation, isUrgent, isOverdue,
		// reminderDays und reminderDate bereits mit
		const contracts = await getContracts(user.userId);

		return { contracts };
	} catch (error) {
		console.error('Fehler beim Laden der Verträge:', error);
		return {
			contracts: [],
			error: 'Verträge konnten nicht geladen werden'
		};
	}
}
