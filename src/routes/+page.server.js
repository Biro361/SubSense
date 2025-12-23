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
		
		return {
			contracts: contracts.map(contract => ({
				...contract,
				_id: contract._id.toString()
			}))
		};
	} catch (error) {
		console.error('Fehler beim Laden der Verträge:', error);
		return {
			contracts: [],
			error: 'Verträge konnten nicht geladen werden'
		};
	}
}
