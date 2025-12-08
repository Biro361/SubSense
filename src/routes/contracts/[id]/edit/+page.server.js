import { fail, redirect } from '@sveltejs/kit';
import { getContractById, updateContract } from '$lib/db/contracts';

// Vertrag laden
export async function load({ params }) {
  const contract = await getContractById(params.id);
  
  if (!contract) {
    throw redirect(303, '/');
  }
  
  return {
    contract
  };
}

// Form Action zum Aktualisieren
export const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    
    const name = formData.get('name');
    const provider = formData.get('provider');
    const cancellationDate = formData.get('cancellationDate');
    const status = formData.get('status');
    const cost = formData.get('cost');
    const billingCycle = formData.get('billingCycle');
    const reminderDays = formData.get('reminderDays') || '7'; // NEU: Erinnerungstage
    
    // Validierung
    if (!name || !provider || !cancellationDate || !cost) {
      return fail(400, {
        error: 'Bitte fülle alle Pflichtfelder aus'
      });
    }
    
    // Kosten validieren
    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      return fail(400, {
        error: 'Bitte gib gültige Kosten ein (mindestens 0)'
      });
    }
    
    // Erinnerungstage validieren
    const parsedReminderDays = parseInt(reminderDays);
    if (isNaN(parsedReminderDays) || parsedReminderDays < 1 || parsedReminderDays > 90) {
      return fail(400, {
        error: 'Erinnerungstage müssen zwischen 1 und 90 liegen'
      });
    }
    
    try {
      await updateContract(params.id, {
        name: name.toString(),
        provider: provider.toString(),
        cancellationDate: new Date(cancellationDate.toString()),
        status: status.toString(),
        cost: parsedCost,
        billingCycle: billingCycle.toString(),
        reminderDays: parsedReminderDays // NEU: Erinnerungstage aktualisieren
      });
      
      throw redirect(303, '/?message=updated');
      
    } catch (error) {
      if (error.status === 303) throw error;
      
      console.error('Fehler beim Aktualisieren:', error);
      return fail(500, {
        error: 'Vertrag konnte nicht aktualisiert werden'
      });
    }
  }
};
