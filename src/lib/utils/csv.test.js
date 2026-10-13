import { describe, it, expect } from 'vitest';
import { contractsToCSV, parseCSV } from './csv.js';

const base = {
  provider: 'Acme',
  cancellationDate: '2026-03-15',
  status: 'active',
  cost: 15.9,
  billingCycle: 'monthly',
  reminderDays: 7,
  category: 'streaming',
  cancellationUrl: null
};

describe('CSV Round-Trip', () => {
  it('übersteht Kommas, Quotes und Zeilenumbrüche', () => {
    const originals = [
      { ...base, name: 'Netflix, Premium', notes: 'sagte "ja"' },
      { ...base, name: 'Zeile1\nZeile2', notes: 'a,b\n"c"' },
      { ...base, name: 'Normal', notes: 'nichts besonderes' }
    ];

    const { contracts, errors } = parseCSV(contractsToCSV(originals));

    expect(errors).toEqual([]);
    expect(contracts).toHaveLength(originals.length);

    originals.forEach((original, index) => {
      expect(contracts[index].name).toBe(original.name);
      expect(contracts[index].notes).toBe(original.notes);
      expect(contracts[index].cost).toBe(original.cost);
      expect(contracts[index].status).toBe(original.status);
      expect(contracts[index].category).toBe(original.category);
      expect(contracts[index].cancellationDate.toISOString().slice(0, 10)).toBe(
        original.cancellationDate
      );
    });
  });

  it('schliesst jedes geöffnete Anführungszeichen', () => {
    const csv = contractsToCSV([{ ...base, name: 'Netflix, Premium', notes: 'mit "Quote"' }]);
    const quotes = csv.match(/"/g) ?? [];

    expect(quotes.length % 2).toBe(0);
  });

  it('entschärft Formeln im Export und nimmt den Schutz beim Import zurück', () => {
    const csv = contractsToCSV([{ ...base, name: '=SUM(A1)', notes: '@cmd' }]);

    expect(csv).toContain("'=SUM(A1)");
    expect(csv).toContain("'@cmd");

    const [parsed] = parseCSV(csv).contracts;
    expect(parsed.name).toBe('=SUM(A1)');
    expect(parsed.notes).toBe('@cmd');
  });

  it('trimmt Namen, lässt Notizen aber zeichengenau', () => {
    const csv = contractsToCSV([{ ...base, name: '  Netflix  ', notes: ' bleibt ' }]);
    const [parsed] = parseCSV(csv).contracts;

    expect(parsed.name).toBe('Netflix');
    expect(parsed.notes).toBe(' bleibt ');
  });

  it('liest handgeschriebenes CSV mit Leerzeichen nach dem Komma', () => {
    const { contracts, errors } = parseCSV(
      'name,provider,cancellationDate,status\nNetflix, Netflix Inc., 2026-03-15, active'
    );

    expect(errors).toEqual([]);
    expect(contracts[0].provider).toBe('Netflix Inc.');
  });

  it('liest Dateien mit CRLF', () => {
    const { contracts, errors } = parseCSV(
      'name,provider,cancellationDate,status\r\nNetflix,Netflix Inc.,2026-03-15,active\r\n'
    );

    expect(errors).toEqual([]);
    expect(contracts).toHaveLength(1);
  });

  it('meldet fehlende Pflichtspalten im Header', () => {
    const { contracts, errors } = parseCSV('name,provider\nNetflix,Netflix Inc.');

    expect(contracts).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('nennt die Zeilennummer bei einer fehlerhaften Zeile', () => {
    const { contracts, errors } = parseCSV(
      [
        'name,provider,cancellationDate,status',
        'Gut,Acme,2026-03-15,active',
        'Schlecht,Acme,15.03.2026,active'
      ].join('\n')
    );

    expect(contracts).toHaveLength(1);
    expect(errors[0]).toContain('Zeile 3');
  });
});
