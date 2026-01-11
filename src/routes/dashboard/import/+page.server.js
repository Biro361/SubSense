import { fail, redirect } from '@sveltejs/kit';
import { parseCSV } from '$lib/utils/csv';
import { createContract } from '$lib/db/contracts';

/**
 * Server Actions für CSV-Import
 */
/** @type {import('./$types').Actions} */
export const actions = {
  // Step 1: Datei hochladen und Preview generieren
  preview: async ({ request, locals }) => {
    const userId = locals.userId;
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

    // Dateigröße limitieren (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return fail(400, {
        error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: 5 MB`
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
    const userId = locals.userId;
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

      // Verträge in DB importieren
      let successCount = 0;
      let failCount = 0;
      const importErrors = [];

      for (const contract of contracts) {
        try {
          await createContract(contract, userId);
          successCount++;
        } catch (error) {
          failCount++;
          importErrors.push(
            `${contract.name || 'Unbekannt'}: ${error.message}`
          );
        }
      }

      // Erfolgreich: Redirect zum Dashboard
      if (failCount === 0) {
        throw redirect(
          303,
          `/dashboard?message=import_success&count=${successCount}`
        );
      } else {
        // Teilweise erfolgreich: Feedback anzeigen
        return {
          partialSuccess: true,
          successCount,
          failCount,
          importErrors
        };
      }
    } catch (error) {
      // Redirect durchlassen
      if (error instanceof Response) throw error;

      console.error('Import error:', error);
      return fail(500, {
        error: 'Import fehlgeschlagen. Bitte versuche es erneut.'
      });
    }
  }
};
