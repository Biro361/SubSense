import { generateTemplateCSV } from '$lib/utils/csv';

/**
 * GET /api/template
 * Stellt eine Template-CSV mit Beispieldaten zum Download bereit
 * Keine Authentifizierung erforderlich (öffentliche Ressource)
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const templateCSV = generateTemplateCSV();

    return new Response(templateCSV, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subsense_template.csv"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return new Response('Template-Generierung fehlgeschlagen', { status: 500 });
  }
}
