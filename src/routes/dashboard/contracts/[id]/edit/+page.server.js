import { fail, redirect, error } from '@sveltejs/kit';
import { getContractById, updateContract } from '$lib/db/contracts';

// Vertrag laden (mit User-Check)
export async function load({ params, locals }) {
  // User aus Session holen
  const user = locals.user;
  
  if (!user) {
    throw redirect(303, '/auth/signin');
  }
  
  // WICHTIG: userId als zweiten Parameter übergeben (Security!)
  const contract = await getContractById(params.id, user.userId);
  
  // Falls null → User ist nicht der Besitzer ODER Vertrag existiert nicht
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden oder keine Berechtigung');
  }
  
  return {
    contract
  };
}

// Form Action zum Aktualisieren (mit User-Check)
export const actions = {
  default: async ({ request, params, locals }) => {
    // User aus Session holen
    const user = locals.user;
    
    if (!user) {
      return fail(401, { error: 'Nicht eingeloggt' });
    }
    
    const formData = await request.formData();
    
    const name = formData.get('name');
    const provider = formData.get('provider');
    const cancellationDate = formData.get('cancellationDate');
    const status = formData.get('status');
    const cost = formData.get('cost');
    const billingCycle = formData.get('billingCycle');
    const reminderDays = formData.get('reminderDays') || '7';
    
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
      // WICHTIG: userId als dritten Parameter übergeben (Security!)
      const success = await updateContract(params.id, {
        name: name.toString(),
        provider: provider.toString(),
        cancellationDate: new Date(cancellationDate.toString()),
        status: status.toString(),
        cost: parsedCost,
        billingCycle: billingCycle.toString(),
        reminderDays: parsedReminderDays
      }, user.userId); // ← NEU: User-Check in DB-Funktion
      
      // Falls false → User ist nicht der Besitzer
      if (!success) {
        return fail(403, {
          error: 'Keine Berechtigung, diesen Vertrag zu bearbeiten'
        });
      }
      
      throw redirect(303, '/dashboard?message=created');
      
    } catch (error) {
      if (error.status === 303) throw error;
      
      console.error('Fehler beim Aktualisieren:', error);
      return fail(500, {
        error: 'Vertrag konnte nicht aktualisiert werden'
      });
    }
  }
};
