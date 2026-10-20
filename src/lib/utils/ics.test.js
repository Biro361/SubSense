import { describe, it, expect } from 'vitest';
import { contractsToICS, generateCalendarFilename } from './ics.js';

const base = {
  _id: 'abc123',
  name: 'Mobile Abo',
  provider: 'Swisscom',
  status: 'active',
  cancellationDate: new Date('2026-10-25T00:00:00.000Z'),
  reminderDays: 14,
  cancellationUrl: null
};

const NOW = new Date('2026-10-21T08:30:00.000Z');

/**
 * Gefaltete Zeilen wieder zusammensetzen, um Inhalte zu prüfen
 * @param {string} ics
 */
function unfold(ics) {
  return ics.replace(/\r\n /g, '');
}

describe('contractsToICS', () => {
  it('erzeugt einen Kalender mit einem Ereignis und CRLF-Zeilenenden', () => {
    const ics = contractsToICS([base], NOW);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    // Kein einzelnes \n ohne vorangehendes \r
    expect(/[^\r]\n/.test(ics)).toBe(false);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('UID:abc123@subsense1.netlify.app');
    expect(ics).toContain('DTSTAMP:20261021T083000Z');
  });

  it('legt die Frist als Ganztags-Ereignis ohne Zeitzone an', () => {
    const ics = contractsToICS([base], NOW);

    expect(ics).toContain('DTSTART;VALUE=DATE:20261025\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261026\r\n');
  });

  it('setzt den Alarm auf 09:00 am Erinnerungstag', () => {
    expect(contractsToICS([base], NOW)).toContain('TRIGGER:-P13DT15H\r\n');
    expect(contractsToICS([{ ...base, reminderDays: 1 }], NOW)).toContain('TRIGGER:-PT15H\r\n');
  });

  it('lässt gekündigte Verträge weg', () => {
    const ics = contractsToICS([base, { ...base, _id: 'gekuendigt', status: 'cancelled' }], NOW);

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).not.toContain('gekuendigt');
  });

  it('escaped Semikolon, Komma, Backslash und Zeilenumbruch', () => {
    const ics = unfold(contractsToICS([{ ...base, name: 'A;B,C\\D' }], NOW));

    expect(ics).toContain('SUMMARY:Kündigungsfrist: A\\;B\\,C\\\\D\r\n');
    expect(ics).toContain('DESCRIPTION:Anbieter: Swisscom\r\n');
  });

  it('faltet lange Zeilen nach 75 Oktetten, ohne Umlaute zu trennen', () => {
    const name = 'Überlänge mit Ümläuten '.repeat(5);
    const ics = contractsToICS([{ ...base, name }], NOW);
    const encoder = new TextEncoder();

    for (const line of ics.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(unfold(ics)).toContain(`SUMMARY:Kündigungsfrist: ${name}\r\n`);
  });

  it('nimmt den Kündigungslink auf, aber nie die Notizen', () => {
    // Wie aus getContracts: der Vertrag bringt seine Notizen mit
    const contract = { ...base, cancellationUrl: 'https://example.ch/kuendigen', notes: 'Kundennr. 4711' };
    const ics = unfold(contractsToICS([contract], NOW));

    expect(ics).toContain('DESCRIPTION:Anbieter: Swisscom\\nKündigen: https://example.ch/kuendigen\r\n');
    expect(ics).not.toContain('4711');
  });

  it('liefert ohne Verträge einen leeren, gültigen Kalender', () => {
    const ics = contractsToICS([], NOW);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});

describe('generateCalendarFilename', () => {
  it('liefert einen .ics-Namen mit Datum', () => {
    expect(generateCalendarFilename()).toMatch(/^subsense_fristen_\d{4}-\d{2}-\d{2}\.ics$/);
  });
});
