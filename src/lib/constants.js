// src/lib/constants.js

/**
 * Verfügbare Vertragskategorien
 * @type {Array<{value: string, label: string}>}
 */
export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'software', label: 'Software' },
  { value: 'telecom', label: 'Mobilfunk & Internet' },
  { value: 'transport', label: 'Transport' },
  { value: 'health-insurance', label: 'Krankenkasse' },
  { value: 'insurance', label: 'Versicherung' },
  { value: 'other', label: 'Sonstiges' }
];

/**
 * Alle gültigen Kategorie-Werte (für Validierung)
 * @type {string[]}
 */
export const VALID_CATEGORIES = CATEGORIES.map(c => c.value);

/**
 * Typische Schweizer Abos fürs Onboarding: befüllen nur das Formular vor.
 * Bewusst ohne Kündigungs-Links der Anbieter – die veralten und wären ungeprüft.
 * @type {Array<{label: string, name: string, provider: string, category: string}>}
 */
export const CONTRACT_SUGGESTIONS = [
  { label: 'Swisscom', name: 'Mobile Abo', provider: 'Swisscom', category: 'telecom' },
  { label: 'Sunrise', name: 'Mobile Abo', provider: 'Sunrise', category: 'telecom' },
  { label: 'Salt', name: 'Mobile Abo', provider: 'Salt', category: 'telecom' },
  { label: 'SBB Halbtax', name: 'Halbtax', provider: 'SBB', category: 'transport' },
  { label: 'SBB GA', name: 'GA', provider: 'SBB', category: 'transport' },
  { label: 'Netflix', name: 'Netflix', provider: 'Netflix', category: 'streaming' },
  { label: 'Spotify', name: 'Spotify', provider: 'Spotify', category: 'streaming' },
  { label: 'Krankenkasse', name: 'Grundversicherung', provider: 'Krankenkasse', category: 'health-insurance' }
];

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

// Nicht 'de-CH': dessen Tausenderzeichen hängt von den ICU-Daten ab (Node 22: ’, Chrome 155: '),
// Server-Rendering und Browser würden sich widersprechen. en-US gruppiert überall mit Komma.
const amountFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Betrag für die Anzeige im Schweizer Format, ohne Währung (z.B. "4’593.80").
 * Nur fürs Markup – das Ergebnis nie wieder mit parseFloat lesen.
 * @param {number | undefined} value
 * @returns {string}
 */
export function formatAmount(value) {
  return amountFormat.format(value || 0).replaceAll(',', '’');
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
