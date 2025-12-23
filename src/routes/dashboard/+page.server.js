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
		// WICHTIG: userId als Parameter übergeben
		const contracts = await getContracts(user.userId);

		// Heute als Referenzdatum
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Contracts anreichern mit isUrgent, isOverdue, daysUntilCancellation
		const enrichedContracts = contracts.map((contract) => {
			const cancellationDate = new Date(contract.cancellationDate);

			// Zeitdifferenz berechnen
			const diffTime = cancellationDate - today;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			// Dringlichkeit berechnen (≤ 7 Tage, aber nicht überfällig)
			const isUrgent = diffDays <= 7 && diffDays >= 0 && contract.status === 'active';

			// Überfällig (negativ und aktiv)
			const isOverdue = diffDays < 0 && contract.status === 'active';

			return {
				...contract,
				_id: contract._id.toString(),
				daysUntilCancellation: diffDays,
				isUrgent,
				isOverdue
			};
		});

		return {
			contracts: enrichedContracts
		};
	} catch (error) {
		console.error('Fehler beim Laden der Verträge:', error);
		return {
			contracts: [],
			error: 'Verträge konnten nicht geladen werden'
		};
	}
}
