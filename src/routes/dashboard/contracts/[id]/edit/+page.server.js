import { fail, redirect, error } from '@sveltejs/kit';
import { getContractById, updateContract } from '$lib/db/contracts';
import { validateContract } from '$lib/validation.js';

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

    // Rohwerte: validateContract nimmt nur die bekannten Felder an
    const raw = Object.fromEntries(await request.formData());
    const { contract, warnings, fieldErrors } = validateContract(raw);

    // Im Formular wird nichts still ersetzt, die Warnungen gelten hier als Fehler.
    // Die Meldungen stehen am Feld, oben nur die Zusammenfassung.
    if (!contract || warnings.length > 0) {
      const count = Object.keys(fieldErrors).length;
      const error = `Bitte korrigiere ${count} ${count === 1 ? 'Feld' : 'Felder'}.`;
      return fail(400, { error, fieldErrors, ...raw });
    }

    try {
      // WICHTIG: userId als dritten Parameter übergeben (Security!)
      const success = await updateContract(params.id, contract, user.userId);


      // Falls false → User ist nicht der Besitzer
      if (!success) {
        return fail(403, {
          error: 'Keine Berechtigung, diesen Vertrag zu bearbeiten'
        });
      }

      throw redirect(303, '/dashboard?message=updated');

    } catch (error) {
      if (error.status === 303) throw error;

      console.error('Fehler beim Aktualisieren:', error);
      return fail(500, {
        error: 'Vertrag konnte nicht aktualisiert werden'
      });
    }
  }
};
