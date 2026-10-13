/**
 * CSV-Utility-Funktionen für Import/Export von Vertragsdaten
 * Unterstützt UTF-8, Sonderzeichen und robustes Error-Handling
 */
// relativ statt $lib, damit die Datei ohne Vite-Alias testbar bleibt
import { validateContract } from '../validation.js';

// Excel und Sheets führen Werte aus, die mit einem dieser Zeichen beginnen
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Escaped einen einzelnen Wert für den CSV-Export
 * @param {*} value - Rohwert
 * @returns {string} CSV-sicheres Feld
 */
function escapeCSVValue(value) {
  let text = String(value ?? '');

  // shortcut: ein Wert, der selbst mit ' + Formelzeichen beginnt, verliert beim
  // Re-Import das Apostroph. Erst relevant, wenn User solche Namen eingeben.
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }

  // Quotes, Kommas, Umbrüche und Rand-Leerzeichen müssen in Anführungszeichen
  if (/[",\n\r]/.test(text) || text !== text.trim()) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * Konvertiert Contract-Array zu CSV-String
 * @param {Array} contracts - Array von Contract-Objekten
 * @param {Array} fields - Zu exportierende Felder (Default: alle)
 * @returns {string} CSV-String mit UTF-8 BOM für Excel-Kompatibilität
 */
export function contractsToCSV(contracts, fields = null) {
  const defaultFields = [
    'name',
    'provider',
    'cancellationDate',
    'status',
    'cost',
    'billingCycle',
    'reminderDays',
    'category',
    'cancellationUrl',
    'notes'
  ];

  const exportFields = fields || defaultFields;

  // Header-Zeile
  const header = exportFields.join(',');

  // Daten-Zeilen
  const rows = contracts.map((contract) => {
    return exportFields
      .map((field) => {
        let value = contract[field] ?? '';

        // Datum-Konvertierung (ISO 8601 Format: YYYY-MM-DD)
        if (field === 'cancellationDate' && value) {
          value = new Date(value).toISOString().split('T')[0];
        }

        return escapeCSVValue(value);
      })
      .join(',');
  });

  // UTF-8 BOM hinzufügen für korrekte Excel-Darstellung von Umlauten
  const bom = '\uFEFF';
  return bom + [header, ...rows].join('\n');
}

/**
 * Erstellt Download-Dateinamen mit Zeitstempel
 * @returns {string} Dateiname im Format "subsense_export_YYYY-MM-DD.csv"
 */
export function generateExportFilename() {
  const date = new Date().toISOString().split('T')[0];
  return `subsense_export_${date}.csv`;
}

/**
 * Parst CSV-String zu Contract-Array mit Validierung
 * @param {string} csvContent - CSV-String (mit oder ohne BOM)
 * @returns {{ contracts: import('../validation.js').ValidatedContract[], errors: string[], warnings: string[] }}
 */
export function parseCSV(csvContent) {
  // BOM entfernen falls vorhanden
  const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();

  const rows = parseCSVRows(cleanContent);

  if (rows.length < 2) {
    return {
      contracts: [],
      errors: ['CSV-Datei ist leer oder enthält keine Daten'],
      warnings: []
    };
  }

  const headers = rows[0];
  const requiredFields = ['name', 'provider', 'cancellationDate', 'status'];

  // Header-Validierung
  const missingFields = requiredFields.filter((f) => !headers.includes(f));
  if (missingFields.length > 0) {
    return {
      contracts: [],
      errors: [
        `Fehlende Pflichtfelder im CSV-Header: ${missingFields.join(', ')}`,
        `Erwarteter Header: name,provider,cancellationDate,status,cost,billingCycle,reminderDays,category,cancellationUrl,notes`
      ],
      warnings: []
    };
  }

  const contracts = [];
  const errors = [];
  const warnings = [];

  // Daten-Zeilen parsen
  for (let i = 1; i < rows.length; i++) {
    try {
      const values = rows[i];

      // Werte zu Contract-Objekt mappen
      /** @type {Record<string, unknown>} */
      const contract = {};
      headers.forEach((header, index) => {
        const value = values[index] || null;

        // Formel-Schutz des Exports wieder entfernen
        contract[header] =
          value && value.startsWith("'") && FORMULA_START.test(value.slice(1))
            ? value.slice(1)
            : value;
      });

      // Eine Regelquelle für Formular und CSV
      const result = validateContract(contract);

      errors.push(...result.errors.map((message) => `Zeile ${i + 1}: ${message}`));
      warnings.push(...result.warnings.map((message) => `Zeile ${i + 1}: ${message}`));

      if (result.contract) {
        contracts.push(result.contract);
      }
    } catch (error) {
      errors.push(`Zeile ${i + 1}: Parsing-Fehler - ${error.message}`);
    }
  }

  return { contracts, errors, warnings };
}

/**
 * Hilfsfunktion: Parst einen kompletten CSV-Text zu Zeilen von Feldern.
 * Gequotete Felder dürfen Kommas und Zeilenumbrüche enthalten und bleiben
 * zeichengenau; nicht gequotete werden getrimmt (handgeschriebenes "a, b").
 * @param {string} text - Kompletter CSV-Inhalt
 * @returns {Array<Array<string>>} Zeilen mit ihren Feldern
 */
function parseCSVRows(text) {
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = '';
  let wasQuoted = false;
  let insideQuotes = false;

  const endField = () => {
    row.push(wasQuoted ? field : field.trim());
    field = '';
    wasQuoted = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (insideQuotes) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        // Escaped Quote ("" -> ")
        field += '"';
        i++;
      } else {
        insideQuotes = false;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      wasQuoted = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++; // CRLF als ein Umbruch
      endField();
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  endField();
  rows.push(row);

  // Leerzeilen verwerfen (z. B. Umbruch am Dateiende)
  return rows.filter((fields) => fields.some((value) => value !== ''));
}

/**
 * Generiert eine Template-CSV mit Beispieldaten
 * @returns {string} CSV-String für Template-Download
 */
export function generateTemplateCSV() {
  const header = 'name,provider,cancellationDate,status,cost,billingCycle,reminderDays,category,cancellationUrl,notes';
  const examples = [
    'Netflix Premium,Netflix Inc.,2026-03-15,active,15.90,monthly,7,streaming,https://netflix.com/cancel,Test-Abo läuft noch',
    'Spotify Family,Spotify AB,2026-06-30,cancelled,16.90,monthly,14,streaming,,Bereits gekündigt am 01.12.2025',
    'Fitness Studio,FitX,2027-01-01,active,29.90,monthly,30,fitness,https://fitx.de/kuendigen,Jahresvertrag bis Ende 2026'
  ];

  const bom = '\uFEFF'; // UTF-8 BOM für Excel
  return bom + [header, ...examples].join('\n');
}
