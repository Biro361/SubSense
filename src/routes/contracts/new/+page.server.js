import { fail, redirect } from '@sveltejs/kit';
import { createContract } from '$lib/db/contracts';

// Form Action zum Erstellen eines Vertrags
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		
		// Formulardaten extrahieren
		const name = formData.get('name');
		const provider = formData.get('provider');
		const cancellationDate = formData.get('cancellationDate');
		const status = formData.get('status') || 'active';
		const cost = formData.get('cost');
		const billingCycle = formData.get('billingCycle') || 'monthly';
		
		// Validierung
		if (!name || !provider || !cancellationDate || !cost) {
			return fail(400, {
				error: 'Bitte fülle alle Pflichtfelder aus',
				name,
				provider,
				cancellationDate,
				cost,
				billingCycle
			});
		}
		
		// Kosten validieren
		const parsedCost = parseFloat(cost);
		if (isNaN(parsedCost) || parsedCost < 0) {
			return fail(400, {
				error: 'Bitte gib gültige Kosten ein (mindestens 0)',
				name,
				provider,
				cancellationDate,
				cost,
				billingCycle
			});
		}
		
		try {
			// Vertrag in Datenbank speichern
			await createContract({
				name: name.toString(),
				provider: provider.toString(),
				cancellationDate: new Date(cancellationDate.toString()),
				status: status.toString(),
				cost: parsedCost,
				billingCycle: billingCycle.toString()
			});
			
			// Erfolg: Redirect zum Dashboard
			throw redirect(303, '/?message=created');
			
		} catch (error) {
			// Falls redirect, weiterwerfen
			if (error.status === 303) throw error;
			
			console.error('Fehler beim Erstellen:', error);
			return fail(500, {
				error: 'Vertrag konnte nicht gespeichert werden',
				name,
				provider,
				cancellationDate,
				cost,
				billingCycle
			});
		}
	}
};
