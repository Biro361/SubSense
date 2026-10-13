// src/lib/validation.js
// relativ statt $lib, damit die Datei ohne Vite-Alias testbar bleibt
import { VALID_CATEGORIES } from './constants.js';

export const VALID_STATUSES = ['active', 'cancelled'];
export const VALID_BILLING_CYCLES = ['monthly', 'yearly', 'quarterly'];

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
export const URL_SHAPE = /^https?:\/\/.+/;

/**
 * Wandelt eine Eingabe in ein Datum. Erlaubt sind Date-Objekte und YYYY-MM-DD;
 * andere Schreibweisen wären mehrdeutig (03/15/2026 vs. 15.03.2026).
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value ?? '').trim();
  if (!DATE_SHAPE.test(text)) {
    return null;
  }

  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Rollover abfangen, falls die Engine 2026-02-31 als 3. März akzeptiert
  return date.toISOString().startsWith(text) ? date : null;
}

/**
 * @typedef {object} ValidatedContract
 * @property {string} name
 * @property {string} provider
 * @property {Date} cancellationDate
 * @property {string} status
 * @property {number} cost
 * @property {string} billingCycle
 * @property {number} reminderDays
 * @property {string} category
 * @property {string|null} cancellationUrl
 * @property {string} notes
 * @property {string} cancellationInstructions
 */

/**
 * Prüft und normalisiert Vertragsdaten aus Formular oder CSV.
 *
 * Harte Fehler gibt es für Pflichtfelder, Datum, Status und Kosten. Zyklus,
 * Erinnerungstage, Kategorie und URL fallen mit einer Warnung auf ihren
 * Standardwert zurück, damit ein CSV-Import an einer Zeile nicht abbricht.
 * Das Ergebnis enthält nur bekannte Felder, ein `_id` aus einem CSV-Header
 * erreicht die Datenbank also nicht.
 *
 * @param {Record<string, unknown>} input - Rohwerte aus Formular oder CSV
 * @returns {{ contract: ValidatedContract|null, errors: string[], warnings: string[] }}
 */
export function validateContract(input) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const name = String(input.name ?? '').trim();
  if (!name) {
    errors.push('Name fehlt.');
  }

  const provider = String(input.provider ?? '').trim();
  if (!provider) {
    errors.push('Anbieter fehlt.');
  }

  const cancellationDate = toDate(input.cancellationDate);
  if (!cancellationDate) {
    errors.push(
      `Ungültiges Kündigungsdatum "${String(input.cancellationDate ?? '')}" (erwartet: YYYY-MM-DD).`
    );
  }

  const status = String(input.status ?? '').trim() || 'active';
  if (!VALID_STATUSES.includes(status)) {
    errors.push(`Ungültiger Status "${status}" (erlaubt: ${VALID_STATUSES.join(', ')}).`);
  }

  const rawCost = String(input.cost ?? '').trim();
  // Number statt parseFloat: "15,90" wurde sonst still zu 15, "12abc" zu 12
  const cost = Number(rawCost.replace(',', '.'));
  if (!Number.isFinite(cost) || cost < 0) {
    errors.push(`Ungültige Kosten "${rawCost}" (Zahl ab 0 erwartet).`);
  }

  let billingCycle = String(input.billingCycle ?? '').trim() || 'monthly';
  if (!VALID_BILLING_CYCLES.includes(billingCycle)) {
    warnings.push(`Ungültiger Abrechnungszyklus "${billingCycle}", verwende "monthly".`);
    billingCycle = 'monthly';
  }

  let reminderDays = Number.parseInt(String(input.reminderDays ?? ''), 10);
  if (!Number.isFinite(reminderDays)) {
    reminderDays = 7;
  } else if (reminderDays < 1 || reminderDays > 90) {
    warnings.push(`Erinnerungstage (${reminderDays}) außerhalb 1-90, verwende 7.`);
    reminderDays = 7;
  }

  let category = String(input.category ?? '').trim() || 'other';
  if (!VALID_CATEGORIES.includes(category)) {
    warnings.push(`Unbekannte Kategorie "${category}", verwende "other".`);
    category = 'other';
  }

  let cancellationUrl = String(input.cancellationUrl ?? '').trim() || null;
  if (cancellationUrl && !URL_SHAPE.test(cancellationUrl)) {
    warnings.push(`Ungültige URL "${cancellationUrl}" (muss mit http:// oder https:// beginnen).`);
    cancellationUrl = null;
  }

  if (errors.length > 0 || !cancellationDate) {
    return { contract: null, errors, warnings };
  }

  return {
    contract: {
      name,
      provider,
      cancellationDate,
      status,
      cost,
      billingCycle,
      reminderDays,
      category,
      cancellationUrl,
      notes: String(input.notes ?? ''),
      cancellationInstructions: String(input.cancellationInstructions ?? '')
    },
    errors,
    warnings
  };
}
