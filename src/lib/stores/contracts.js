// src/lib/stores/contracts.js
import { writable } from 'svelte/store';

// Wir nutzen einen "writable" Store, damit wir Daten lesen und schreiben können.
// Hier simulieren wir Startdaten, damit das Dashboard nicht leer ist.
export const contracts = writable([
  {
    id: 1,
    name: 'Netflix',
    cost: 17.90,
    cycle: 'monatlich',
    nextDueDate: '2025-12-20', // Fiktives Datum
    cancellationNotice: 30, // Kündigungsfrist in Tagen
    category: 'Entertainment'
  },
  {
    id: 2,
    name: 'Spotify',
    cost: 12.95,
    cycle: 'monatlich',
    nextDueDate: '2025-12-15',
    cancellationNotice: 30,
    category: 'Music'
  },
  {
    id: 3,
    name: 'Fitnessstudio',
    cost: 69.00,
    cycle: 'jährlich',
    nextDueDate: '2026-01-31',
    cancellationNotice: 90, // 3 Monate Frist
    category: 'Health'
  }
]);
