import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateReminderMetadata, compareByDeadline } from './reminders.js';

/**
 * Lokaler Kalendertag relativ zu heute
 * @param {number} days
 * @returns {Date}
 */
function dayOffset(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

describe('calculateReminderMetadata', () => {
  beforeEach(() => {
    // Fester Bezugspunkt, sonst hängt das Ergebnis am Ausführungstag
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T08:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('zählt 0 Tage am Tag der Kündigungsfrist und meldet dringend', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(0),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(0);
    expect(result.isUrgent).toBe(true);
    expect(result.isOverdue).toBe(false);
  });

  it('zählt 7 Tage und meldet dringend an der Fenstergrenze', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(7),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(7);
    expect(result.isUrgent).toBe(true);
    expect(result.isOverdue).toBe(false);
  });

  it('meldet einen Tag nach der Frist überfällig, nicht dringend', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(-1),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(-1);
    expect(result.isOverdue).toBe(true);
    expect(result.isUrgent).toBe(false);
  });

  it('meldet einen Tag vor dem Fenster noch nicht dringend', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(8),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(8);
    expect(result.isUrgent).toBe(false);
    expect(result.isOverdue).toBe(false);
  });

  it('zählt über die Zeitumstellung hinweg Kalendertage', () => {
    // 20.10. -> 27.10.2026 sind in Zürich 169 Stunden; in Stunden gerechnet
    // ergäbe das 8 Tage und die Erinnerung käme einen Tag zu früh
    const result = calculateReminderMetadata({
      cancellationDate: new Date('2026-10-27T00:00:00.000Z'),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(7);
  });

  it('zählt kurz nach Mitternacht Schweizer Zeit schon den neuen Tag', () => {
    // 22:30 UTC am 20.10. ist 00:30 am 21.10. in Zürich
    vi.setSystemTime(new Date('2026-10-20T22:30:00.000Z'));

    const result = calculateReminderMetadata({
      cancellationDate: new Date('2026-10-21T00:00:00.000Z'),
      reminderDays: 7,
      status: 'active'
    });

    expect(result.daysUntilCancellation).toBe(0);
  });

  it('kennzeichnet gekündigte Verträge weder als dringend noch als überfällig', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(-5),
      reminderDays: 7,
      status: 'cancelled'
    });

    expect(result.isOverdue).toBe(false);
    expect(result.isUrgent).toBe(false);
  });

  it('nutzt 7 Erinnerungstage als Standard', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(3),
      status: 'active'
    });

    expect(result.reminderDays).toBe(7);
  });

  it('legt das Erinnerungsdatum um reminderDays vor die Frist', () => {
    const result = calculateReminderMetadata({
      cancellationDate: dayOffset(30),
      reminderDays: 14,
      status: 'active'
    });

    expect(result.reminderDate.getTime()).toBe(dayOffset(16).getTime());
  });
});

describe('compareByDeadline', () => {
  it('sortiert überfällige vor dringenden vor den übrigen', () => {
    const later = { name: 'später', cancellationDate: dayOffset(60), isUrgent: false, isOverdue: false };
    const urgent = { name: 'dringend', cancellationDate: dayOffset(3), isUrgent: true, isOverdue: false };
    const overdue = { name: 'überfällig', cancellationDate: dayOffset(-1), isUrgent: false, isOverdue: true };

    const sorted = [later, urgent, overdue].sort(compareByDeadline);

    expect(sorted.map((c) => c.name)).toEqual(['überfällig', 'dringend', 'später']);
  });
});
