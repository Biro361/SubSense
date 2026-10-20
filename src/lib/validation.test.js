import { describe, it, expect } from 'vitest';
import { validateContract } from './validation.js';

/**
 * Erwartet eine gültige Eingabe und gibt den Vertrag zurück
 * @param {ReturnType<typeof validateContract>} result
 */
function expectValid(result) {
  expect(result.errors).toEqual([]);
  if (!result.contract) {
    throw new Error('Vertrag wurde unerwartet abgelehnt');
  }
  return result.contract;
}

const valid = {
  name: 'Netflix',
  provider: 'Netflix Inc.',
  cancellationDate: '2026-03-15',
  status: 'active',
  cost: '15.90',
  billingCycle: 'monthly',
  reminderDays: '7',
  category: 'streaming',
  cancellationUrl: 'https://netflix.com/cancel'
};

describe('validateContract', () => {
  it('normalisiert Typen einer gültigen Eingabe', () => {
    const result = validateContract(valid);
    const contract = expectValid(result);

    expect(result.warnings).toEqual([]);
    expect(contract.cost).toBe(15.9);
    expect(contract.reminderDays).toBe(7);
    expect(contract.cancellationDate).toBeInstanceOf(Date);
    expect(contract.cancellationDate.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('lässt nur bekannte Felder durch', () => {
    const contract = expectValid(
      validateContract({ ...valid, _id: 'gekapert', userId: 'fremd', evil: 1 })
    );

    expect(Object.keys(contract).sort()).toEqual([
      'billingCycle',
      'cancellationDate',
      'cancellationInstructions',
      'cancellationUrl',
      'category',
      'cost',
      'name',
      'notes',
      'provider',
      'reminderDays',
      'status'
    ]);
  });

  it.each([
    ['leerer Name', { name: '' }],
    ['Name nur Leerzeichen', { name: '   ' }],
    ['fehlender Anbieter', { provider: '' }],
    ['fehlendes Datum', { cancellationDate: '' }],
    ['Punkt-Datum mit 31. Februar', { cancellationDate: '31.02.2026' }],
    ['Datum mit Schrägstrich', { cancellationDate: '15/03/2026' }],
    ['Punkt-Datum ohne führende Null', { cancellationDate: '1.3.2026' }],
    ['30. Februar', { cancellationDate: '2026-02-31' }],
    ['Monat 13', { cancellationDate: '2026-13-01' }],
    ['unbekannter Status', { status: 'geloescht' }],
    ['negative Kosten', { cost: '-5' }],
    ['Kosten keine Zahl', { cost: 'abc' }],
    ['Kosten mit Anhang', { cost: '12abc' }]
  ])('weist %s als Fehler ab', (_label, patch) => {
    const { contract, errors } = validateContract({ ...valid, ...patch });

    expect(contract).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fällt bei weichen Feldern auf Standardwerte zurück und warnt', () => {
    const result = validateContract({
      ...valid,
      billingCycle: 'weekly',
      reminderDays: '500',
      category: 'raumfahrt',
      cancellationUrl: 'netflix.com'
    });
    const contract = expectValid(result);

    expect(result.warnings).toHaveLength(4);
    expect(contract.billingCycle).toBe('monthly');
    expect(contract.reminderDays).toBe(7);
    expect(contract.category).toBe('other');
    expect(contract.cancellationUrl).toBeNull();
  });

  it('liest ein Dezimalkomma als Dezimalpunkt', () => {
    const { contract } = validateContract({ ...valid, cost: '15,90' });

    expect(contract.cost).toBe(15.9);
  });

  it('kommt mit nur den Pflichtfeldern aus', () => {
    const result = validateContract({
      name: 'Spotify',
      provider: 'Spotify AB',
      cancellationDate: '2026-06-30'
    });
    const contract = expectValid(result);

    expect(result.warnings).toEqual([]);
    expect(contract.status).toBe('active');
    expect(contract.cost).toBe(0);
    expect(contract.category).toBe('other');
    expect(contract.notes).toBe('');
  });

  it('akzeptiert ein Date-Objekt aus dem Formular', () => {
    const contract = expectValid(
      validateContract({ ...valid, cancellationDate: new Date('2026-03-15T00:00:00.000Z') })
    );

    expect(contract.cancellationDate).toBeInstanceOf(Date);
  });

  it('akzeptiert TT.MM.JJJJ', () => {
    const contract = expectValid(validateContract({ ...valid, cancellationDate: '31.12.2026' }));

    expect(contract.cancellationDate.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('nennt beide Datumsformate in der Fehlermeldung', () => {
    const { errors } = validateContract({ ...valid, cancellationDate: '31.13.2026' });

    expect(errors[0]).toContain('JJJJ-MM-TT oder TT.MM.JJJJ');
  });

  it('behält Notizen aus dem Import', () => {
    const contract = expectValid(validateContract({ ...valid, notes: 'läuft noch' }));

    expect(contract.notes).toBe('läuft noch');
  });
});
