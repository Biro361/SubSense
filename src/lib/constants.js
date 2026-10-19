// src/lib/constants.js

/**
 * Verfügbare Vertragskategorien
 * @type {Array<{value: string, label: string}>}
 */
export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'software', label: 'Software' },
  { value: 'transport', label: 'Transport' },
  { value: 'insurance', label: 'Versicherung' },
  { value: 'other', label: 'Sonstiges' }
];

/**
 * Alle gültigen Kategorie-Werte (für Validierung)
 * @type {string[]}
 */
export const VALID_CATEGORIES = CATEGORIES.map(c => c.value);

/**
 * Hilfsfunktion: Kategorie-Objekt anhand Wert finden
 * @param {string} value - Kategorie-Wert (z.B. "streaming")
 * @returns {object|null}
 */
export function getCategoryByValue(value) {
  return CATEGORIES.find(c => c.value === value) || null;
}

/**
 * Kosten eines Vertrags auf einen Monat umgerechnet
 * @param {{ cost?: number, billingCycle?: string }} contract
 * @returns {number}
 */
export function monthlyCost(contract) {
  const cost = contract.cost || 0;

  if (contract.billingCycle === 'yearly') return cost / 12;
  if (contract.billingCycle === 'quarterly') return cost / 3;
  return cost;
}

export const PASSWORD_MIN_LENGTH = 8;

// bcrypt schneidet alles über 72 Byte stillschweigend ab
export const PASSWORD_MAX_BYTES = 72;

/**
 * Gemeinsame Passwortregel für Signup und Passwortwechsel
 * @param {unknown} password
 * @returns {string|null} Fehlermeldung oder null
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`;
  }

  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Passwort darf maximal ${PASSWORD_MAX_BYTES} Byte lang sein.`;
  }

  return null;
}
