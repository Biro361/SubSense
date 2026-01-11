/**
 * CSV-Utility-Funktionen für Import/Export von Vertragsdaten
 * Unterstützt UTF-8, Sonderzeichen und robustes Error-Handling
 */

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

        // CSV-Escape: Anführungszeichen bei Kommas/Newlines/Quotes
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('\n') || value.includes('"'))
        ) {
          value = `"${value.replace(/"/g, '""')}`; // Doppelte Quotes escapen
        }

        return value;
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

  const lines = cleanContent.split('\n').map((line) => line.trim());

  if (lines.length < 2) {
    return {
      contracts: [],
      errors: ['CSV-Datei ist leer oder enthält keine Daten'],
      warnings: []
    };
  }

  // Header parsen (mit Quote-Handling)
  const headers = parseCSVLine(lines[0]);
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
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Leere Zeilen überspringen

    try {
      const values = parseCSVLine(line);

      // Werte zu Contract-Objekt mappen
      const contract = {};
      headers.forEach((header, index) => {
        contract[header] = values[index] || null;
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
 * Hilfsfunktion: Parst eine einzelne CSV-Zeile mit Quote-Handling
 * Unterstützt: "Wert mit, Komma", einfache Werte, escaped Quotes
 * @param {string} line - CSV-Zeile
 * @returns {Array<string>} Array von Werten
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped Quote ("" -> ")
        current += '"';
        i++; // Überspringen
      } else {
        // Quote-Beginn oder -Ende
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Feldtrenner (nur außerhalb von Quotes)
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Letzter Wert
  values.push(current.trim());

  return values;
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
