import { describe, it, expect } from 'vitest';
import { monthlyCost } from './constants.js';

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
