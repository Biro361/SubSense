// Täglicher Auslöser für die Erinnerungs-Mails. Netlify bündelt diese Datei ohne
// SvelteKit, $env und $lib sind hier nicht auflösbar: darum nur ein Aufruf des
// geschützten Endpoints, die ganze Logik liegt in src/routes/internal/send-reminders.

// Geplante Functions dürfen 30 s laufen; der Endpoint hält sich an 20 s
const TIMEOUT_MS = 25_000;

export default async () => {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    console.error('Reminder trigger error: SITE_URL or CRON_SECRET is missing');
    return new Response(null, { status: 500 });
  }

  try {
    const response = await fetch(`${siteUrl}/internal/send-reminders`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    // Die Zusammenfassung enthält nur Zähler, keine Adressen
    console.log('Reminder trigger:', response.status, (await response.text()).slice(0, 500));
    return new Response(null, { status: response.ok ? 200 : 502 });
  } catch (error) {
    console.error('Reminder trigger error:', error instanceof Error ? error.name : error);
    return new Response(null, { status: 502 });
  }
};

// 06:00 UTC = 07:00 Winterzeit / 08:00 Sommerzeit in der Schweiz
export const config = { schedule: '0 6 * * *' };
