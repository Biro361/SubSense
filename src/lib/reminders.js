// src/lib/reminders.js

/**
 * Kalendertage zwischen zwei Daten.
 * Gerechnet wird über UTC-Mitternacht der jeweiligen Kalendertage, weil eine
 * Zeitumstellung sonst einen Tag dazuzählt: vom 20.10. zum 27.10. ergäbe die
 * Differenz in Zürich 169 Stunden und damit 8 statt 7 Tage.
 * @param {Date} from
 * @param {Date} to
 * @returns {number}
 */
function calendarDaysBetween(from, to) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Berechnet Erinnerungs-Metadaten für einen Vertrag
 * @param {{ cancellationDate: Date|string, reminderDays?: number, status?: string }} contract
 * @returns {{ reminderDays: number, reminderDate: Date, daysUntilCancellation: number, isUrgent: boolean, isOverdue: boolean }}
 */
export function calculateReminderMetadata(contract) {
  const cancellationDate = new Date(contract.cancellationDate);
  cancellationDate.setHours(0, 0, 0, 0);

  // "Heute" ist der Kalendertag der Nutzer, nicht des Servers: Netlify läuft in UTC
  // und zählte zwischen 00:00 und 02:00 Schweizer Zeit noch den Vortag.
  // shortcut: feste Zeitzone, pro User speichern sobald jemand ausserhalb der Schweiz dazukommt
  const today = new Date(
    `${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T00:00:00`
  );

  // Tage bis zur Kündigungsfrist berechnen
  const daysUntilCancellation = calendarDaysBetween(today, cancellationDate);

  // Erinnerungstage (Standard: 7 Tage vor Kündigungsfrist)
  const reminderDays = contract.reminderDays ?? 7;

  // Erinnerungsdatum berechnen
  const reminderDate = new Date(cancellationDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);

  // Kündigungsfrist bereits verpasst
  const isOverdue = contract.status === 'active' && daysUntilCancellation < 0;

  // Im Erinnerungszeitraum, aber noch nicht überfällig
  const isUrgent =
    contract.status === 'active' &&
    daysUntilCancellation <= reminderDays &&
    daysUntilCancellation >= 0;

  return {
    reminderDays,
    reminderDate,
    daysUntilCancellation,
    isUrgent,
    isOverdue
  };
}
