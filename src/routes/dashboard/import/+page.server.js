import { fail, redirect } from '@sveltejs/kit';
import { parseCSV } from '$lib/utils/csv';
import { createContracts } from '$lib/db/contracts';

// Deckel gegen das Zeitlimit der Netlify-Function
const MAX_IMPORT_ROWS = 500;

/**
 * Server Actions für CSV-Import
 */
/** @type {import('./$types').Actions} */
export const actions = {
  // Step 1: Datei hochladen und Preview generieren
  preview: async ({ request, locals }) => {
    // Auth-Check: Der Hook setzt `locals.user` mit { userId, email }
    const userId = locals.user?.userId;
    if (!userId) {
      return fail(401, { error: 'Nicht autorisiert' });
    }

    const formData = await request.formData();
    const file = formData.get('csvFile');

    // Datei-Validierung
    if (!file || file.size === 0) {
      return fail(400, { error: 'Keine Datei ausgewählt' });
    }

    if (!file.name.endsWith('.csv')) {
      return fail(400, { error: 'Nur CSV-Dateien erlaubt (.csv)' });
    }

    // 4 MB: Netlify nimmt pro Request rund 6 MB an, Uploads wachsen unterwegs um ein Drittel
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return fail(400, {
        error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: 4 MB`
      });
    }

    try {
      // CSV-Inhalt lesen
      const csvContent = await file.text();

      // CSV parsen
      const { contracts, errors, warnings } = parseCSV(csvContent);

      // Wenn Parse-Fehler vorliegen, Preview trotzdem zeigen (für Feedback)
      if (errors.length > 0 && contracts.length === 0) {
        return fail(400, {
          error: 'CSV-Validierung fehlgeschlagen',
          validationErrors: errors,
          warnings: warnings
        });
      }

      if (contracts.length > MAX_IMPORT_ROWS) {
        return fail(400, {
          error: `Zu viele Zeilen (${contracts.length}). Maximal ${MAX_IMPORT_ROWS} pro Import - teile die Datei auf.`
        });
      }

      // Erfolgreiche Vorschau
      return {
        preview: true,
        contracts: contracts,
        totalContracts: contracts.length,
        errors: errors,
        warnings: warnings,
        csvContent: csvContent // Für finalen Import speichern
      };
    } catch (error) {
      console.error('Preview error:', error);
      return fail(500, {
        error: 'Fehler beim Lesen der Datei. Bitte überprüfe das Format.'
      });
    }
  },

  // Step 2: Bestätigter Import
  import: async ({ request, locals }) => {
    const userId = locals.user?.userId;
    if (!userId) {
      return fail(401, { error: 'Nicht autorisiert' });
    }

    const formData = await request.formData();
    const csvContent = formData.get('csvContent');

    if (!csvContent) {
      return fail(400, { error: 'Keine Daten zum Importieren vorhanden' });
    }

    try {
      // CSV erneut parsen (sicherheitshalber)
      const { contracts, errors } = parseCSV(csvContent);

      if (errors.length > 0 && contracts.length === 0) {
        return fail(400, {
          error: 'Keine gültigen Verträge zum Importieren',
          validationErrors: errors
        });
      }

      if (contracts.length > MAX_IMPORT_ROWS) {
        return fail(400, {
          error: `Zu viele Zeilen (${contracts.length}). Maximal ${MAX_IMPORT_ROWS} pro Import - teile die Datei auf.`
        });
      }

      // Alle Zeilen in einem Schreibvorgang
      const insertedCount = await createContracts(contracts, userId);

      throw redirect(303, `/dashboard?message=import_success&count=${insertedCount}`);
    } catch (error) {
      // Redirect durchlassen
      if (error?.status === 303) throw error;

      console.error('Import error:', error);
      return fail(500, {
        error: 'Import fehlgeschlagen. Bitte versuche es erneut.'
      });
    }
  }
};
