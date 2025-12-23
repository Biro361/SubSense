import { fail, redirect } from '@sveltejs/kit';
import { createContract } from '$lib/db/contracts';

// Form Action zum Erstellen eines Vertrags
export const actions = {
	default: async ({ request, locals }) => {
		// WICHTIG: User aus Session holen
		const user = locals.user;
		
		if (!user) {
			return fail(401, { error: 'Nicht eingeloggt' });
		}
		
		const formData = await request.formData();
		
		const name = formData.get('name');
		const provider = formData.get('provider');
		const cancellationDate = formData.get('cancellationDate');
		const status = formData.get('status') || 'active';
		const cost = formData.get('cost');
		const billingCycle = formData.get('billingCycle') || 'monthly';
		const reminderDays = formData.get('reminderDays') || '7';
		
		// Validierung (bleibt gleich)
		if (!name || !provider || !cancellationDate || !cost) {
			return fail(400, {
				error: 'Bitte fülle alle Pflichtfelder aus',
				name, provider, cancellationDate, cost, billingCycle, reminderDays
			});
		}
		
		const parsedCost = parseFloat(cost);
		if (isNaN(parsedCost) || parsedCost < 0) {
			return fail(400, {
				error: 'Bitte gib gültige Kosten ein (mindestens 0)',
				name, provider, cancellationDate, cost, billingCycle, reminderDays
			});
		}
		
		const parsedReminderDays = parseInt(reminderDays);
		if (isNaN(parsedReminderDays) || parsedReminderDays < 1 || parsedReminderDays > 90) {
			return fail(400, {
				error: 'Erinnerungstage müssen zwischen 1 und 90 liegen',
				name, provider, cancellationDate, cost, billingCycle, reminderDays
			});
		}
		
		try {
			// WICHTIG: userId als zweiten Parameter übergeben
			await createContract({
				name: name.toString(),
				provider: provider.toString(),
				cancellationDate: new Date(cancellationDate.toString()),
				status: status.toString(),
				cost: parsedCost,
				billingCycle: billingCycle.toString(),
				reminderDays: parsedReminderDays
			}, user.userId); // ← NEU: User zuweisen
			
			throw redirect(303, '/?message=created');
			
		} catch (error) {
			if (error.status === 303) throw error;
			
			console.error('Fehler beim Erstellen:', error);
			return fail(500, {
				error: 'Vertrag konnte nicht gespeichert werden',
				name, provider, cancellationDate, cost, billingCycle, reminderDays
			});
		}
	}
};
