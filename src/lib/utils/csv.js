/**
 * CSV-Utility-Funktionen für Import/Export von Vertragsdaten
 * Unterstützt UTF-8, Sonderzeichen und robustes Error-Handling
 */

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
 * @returns {object} { contracts: Array, errors: Array, warnings: Array }
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
      const contract = {};
      headers.forEach((header, index) => {
        const value = values[index] || null;

        // Formel-Schutz des Exports wieder entfernen
        contract[header] =
          value && value.startsWith("'") && FORMULA_START.test(value.slice(1))
            ? value.slice(1)
            : value;
      });

      // Validierung der Pflichtfelder
      if (!contract.name || !contract.provider || !contract.cancellationDate) {
        errors.push(
          `Zeile ${i + 1}: Pflichtfelder (name, provider, cancellationDate) fehlen oder sind leer`
        );
        continue;
      }

      // Datum-Validierung (Format: YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(contract.cancellationDate)) {
        errors.push(
          `Zeile ${i + 1}: Ungültiges Datum "${contract.cancellationDate}" (erwartet: YYYY-MM-DD, z.B. 2026-03-15)`
        );
        continue;
      }

      // Datum-Plausibilität prüfen
      const parsedDate = new Date(contract.cancellationDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push(
          `Zeile ${i + 1}: Ungültiges Datum "${contract.cancellationDate}" (nicht parsebar)`
        );
        continue;
      }

      // Status-Validierung
      const validStatuses = ['active', 'cancelled'];
      if (!validStatuses.includes(contract.status)) {
        errors.push(
          `Zeile ${i + 1}: Ungültiger Status "${contract.status}" (erlaubt: active, cancelled)`
        );
        continue;
      }

      // Typ-Konvertierung & Defaults
      contract.cost = parseFloat(contract.cost) || 0;
      contract.reminderDays = parseInt(contract.reminderDays) || 7;
      contract.billingCycle = contract.billingCycle || 'monthly';
      contract.category = contract.category || 'other';
      contract.notes = contract.notes || '';

      // BillingCycle-Validierung
      const validCycles = ['monthly', 'yearly', 'quarterly'];
      if (!validCycles.includes(contract.billingCycle)) {
        warnings.push(
          `Zeile ${i + 1}: Ungültiger Abrechnungszyklus "${contract.billingCycle}", verwende "monthly" als Standard`
        );
        contract.billingCycle = 'monthly';
      }

      // ReminderDays-Validierung
      if (contract.reminderDays < 1 || contract.reminderDays > 90) {
        warnings.push(
          `Zeile ${i + 1}: Erinnerungstage (${contract.reminderDays}) außerhalb 1-90, verwende 7 Tage als Standard`
        );
        contract.reminderDays = 7;
      }

      // Kategorie-Validierung
      const validCategories = [
        'streaming',
        'fitness',
        'software',
        'transport',
        'insurance',
        'other'
      ];
      if (!validCategories.includes(contract.category)) {
        warnings.push(
          `Zeile ${i + 1}: Unbekannte Kategorie "${contract.category}", verwende "other" als Standard`
        );
        contract.category = 'other';
      }

      // URL-Validierung (optional)
      if (contract.cancellationUrl && contract.cancellationUrl !== '') {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(contract.cancellationUrl)) {
          warnings.push(
            `Zeile ${i + 1}: Ungültige URL "${contract.cancellationUrl}" (muss mit http:// oder https:// beginnen)`
          );
          contract.cancellationUrl = null;
        }
      } else {
        contract.cancellationUrl = null;
      }

      contracts.push(contract);
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
