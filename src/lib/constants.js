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
