/**
 * Kalender-Export (iCalendar, RFC 5545) der Kündigungsfristen
 */

// Feste Domain statt Request-Host, damit ein erneuter Import Ereignisse aktualisiert statt verdoppelt
const UID_DOMAIN = 'subsense1.netlify.app';

// RFC 5545: Zeilen höchstens 75 Oktette, danach mit CRLF + Leerzeichen fortsetzen
const MAX_LINE_OCTETS = 75;

const encoder = new TextEncoder();

/**
 * Escaped Text für TEXT-Werte (SUMMARY, DESCRIPTION)
 * @param {*} value
 * @returns {string}
 */
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Faltet eine Zeile nach Oktetten; Umlaute zählen doppelt
 * @param {string} line
 * @returns {string}
 */
function foldLine(line) {
  const parts = [];
  let current = '';
  let octets = 0;

  // for…of läuft über Codepoints und trennt so kein Zeichen in der Mitte
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > MAX_LINE_OCTETS) {
      parts.push(current);
      // Das führende Leerzeichen der Folgezeile zählt mit
      current = ' ';
      octets = 1;
    }
    current += char;
    octets += size;
  }
  parts.push(current);

  return parts.join('\r\n');
}

/**
 * Ganztags-Datum JJJJMMTT aus dem UTC-Datum, wie beim CSV-Export
 * @param {Date|string} value
 * @returns {string}
 */
function toICSDate(value) {
  return new Date(value).toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Zeitstempel JJJJMMTTTHHMMSSZ für DTSTAMP
 * @param {Date} value
 * @returns {string}
 */
function toICSTimestamp(value) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Alarm um 09:00 am Erinnerungstag. Ein Ganztags-Ereignis beginnt um 00:00,
 * also liegt 09:00 von n Tagen vorher (n - 1) Tage und 15 Stunden davor.
 * @param {number} reminderDays - mindestens 1
 * @returns {string}
 */
function alarmTrigger(reminderDays) {
  const days = reminderDays - 1;
  return `-P${days > 0 ? `${days}D` : ''}T15H`;
}

/**
 * Wandelt Verträge in eine iCalendar-Datei mit einem Ereignis pro aktiver Frist
 * @param {Array<{ _id: string, name: string, provider?: string, status: string, cancellationDate: Date|string, reminderDays: number, cancellationUrl?: string|null }>} contracts
 * @param {Date} [now] - Zeitpunkt für DTSTAMP
 * @returns {string} iCalendar-Text mit CRLF
 */
export function contractsToICS(contracts, now = new Date()) {
  const stamp = toICSTimestamp(now);

  const events = contracts
    .filter((contract) => contract.status === 'active' && contract.cancellationDate)
    .flatMap((contract) => {
      const start = new Date(contract.cancellationDate);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

      // Notizen bewusst nicht: sie können Kundennummern enthalten und landen in Drittkalendern
      const description = [
        contract.provider ? `Anbieter: ${contract.provider}` : '',
        contract.cancellationUrl ? `Kündigen: ${contract.cancellationUrl}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      return [
        'BEGIN:VEVENT',
        `UID:${contract._id}@${UID_DOMAIN}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${toICSDate(start)}`,
        `DTEND;VALUE=DATE:${toICSDate(end)}`,
        `SUMMARY:${escapeText(`Kündigungsfrist: ${contract.name}`)}`,
        ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`Kündigungsfrist: ${contract.name}`)}`,
        `TRIGGER:${alarmTrigger(contract.reminderDays)}`,
        'END:VALARM',
        'END:VEVENT'
      ];
    });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SubSense//Vertrags-Radar//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ];

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/**
 * Erstellt Download-Dateinamen mit Zeitstempel
 * @returns {string} Dateiname im Format "subsense_fristen_YYYY-MM-DD.ics"
 */
export function generateCalendarFilename() {
  const date = new Date().toISOString().split('T')[0];
  return `subsense_fristen_${date}.ics`;
}
