import { getContracts } from '$lib/db/contracts';

// Lädt alle Verträge beim Seitenaufruf
export async function load() {
	try {
		const contracts = await getContracts();
		
		return {
			contracts: contracts.map(contract => ({
				...contract,
				_id: contract._id.toString() // ObjectId zu String konvertieren
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
