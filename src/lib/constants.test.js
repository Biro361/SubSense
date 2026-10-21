import { describe, it, expect } from 'vitest';
import { CONTRACT_SUGGESTIONS, VALID_CATEGORIES, formatAmount, monthlyCost } from './constants.js';

describe('CONTRACT_SUGGESTIONS', () => {
  it('hat nur gültige Kategorien und keine leeren Texte', () => {
    expect(CONTRACT_SUGGESTIONS.length).toBeGreaterThanOrEqual(6);
    for (const s of CONTRACT_SUGGESTIONS) {
      expect(VALID_CATEGORIES).toContain(s.category);
      expect(s.label.trim()).not.toBe('');
      expect(s.name.trim()).not.toBe('');
      expect(s.provider.trim()).not.toBe('');
    }
  });
});

describe('monthlyCost', () => {
  it('rechnet jeden Zyklus auf einen Monat um', () => {
    expect(monthlyCost({ cost: 15.9, billingCycle: 'monthly' })).toBe(15.9);
    expect(monthlyCost({ cost: 30, billingCycle: 'quarterly' })).toBe(10);
    expect(monthlyCost({ cost: 120, billingCycle: 'yearly' })).toBe(10);
  });

  it('nimmt bei fehlenden Angaben 0 und monatlich an', () => {
    expect(monthlyCost({})).toBe(0);
    expect(monthlyCost({ cost: 5 })).toBe(5);
  });
});

describe('formatAmount', () => {
  it('gruppiert Tausender mit Apostroph (U+2019) und zeigt zwei Nachkommastellen', () => {
    expect(formatAmount(3995)).toBe('3’995.00');
    expect(formatAmount(1234567.891)).toBe('1’234’567.89');
  });

  it('ergänzt fehlende Rappen und nimmt bei fehlendem Betrag 0', () => {
    expect(formatAmount(49.9)).toBe('49.90');
    expect(formatAmount(0)).toBe('0.00');
    expect(formatAmount(undefined)).toBe('0.00');
  });
});
