import { json } from '@sveltejs/kit';
import { getContracts } from '$lib/db/contracts';
import { contractsToICS, generateCalendarFilename } from '$lib/utils/ics';

/**
 * GET /api/calendar
 * Exportiert die Kündigungsfristen des eingeloggten Users als iCalendar-Datei
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  // Auth-Check: hooks.server.js setzt locals.user
  const userId = locals.user?.userId;

  if (!userId) {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const contracts = await getContracts(userId);

    return new Response(contractsToICS(contracts), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${generateCalendarFilename()}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Calendar export error:', error);
    return json(
      { error: 'Kalender-Export fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    );
  }
}
