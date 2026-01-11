import { json } from '@sveltejs/kit';
import { getContracts } from '$lib/db/contracts';
import { contractsToCSV, generateExportFilename } from '$lib/utils/csv';

/**
 * GET /api/export
 * Exportiert alle Verträge des eingeloggten Users als CSV-Datei
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  const userId = locals.userId;

  // Auth-Check
  if (!userId) {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    // Alle Verträge des Users abrufen
    const contracts = await getContracts(userId);

    // Zu CSV konvertieren
    const csvContent = contractsToCSV(contracts);

    // Als Download zurückgeben
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${generateExportFilename()}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return json(
      { error: 'Export fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    );
  }
}
