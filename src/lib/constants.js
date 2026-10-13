// src/lib/constants.js

/**
 * Verfügbare Vertragskategorien
 * @type {Array<{value: string, label: string, icon: string, color: string}>}
 */
export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming', icon: '📺', color: 'purple' },
  { value: 'fitness', label: 'Fitness', icon: '💪', color: 'green' },
  { value: 'software', label: 'Software', icon: '💻', color: 'blue' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: 'yellow' },
  { value: 'insurance', label: 'Versicherung', icon: '🛡️', color: 'red' },
  { value: 'other', label: 'Sonstiges', icon: '📦', color: 'gray' }
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

export const PASSWORD_MIN_LENGTH = 8;

// bcrypt schneidet alles über 72 Byte stillschweigend ab
export const PASSWORD_MAX_BYTES = 72;

/**
 * Gemeinsame Passwortregel für Signup, Passwortwechsel und Reset
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
