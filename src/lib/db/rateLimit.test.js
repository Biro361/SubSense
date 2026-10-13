import { describe, it, expect, vi } from 'vitest';
import { recordAttempt } from './rateLimit.js';

vi.mock('$lib/mongodb', () => ({
  getDatabase: async () => ({
    collection: () => ({
      createIndex: async () => 'expiresAt_1',
      bulkWrite: async () => ({}),
      find: () => ({
        // absichtlich andere Reihenfolge als die Schlüssel
        toArray: async () => [
          { _id: 'login:mail:a@b.c', attempts: 11 },
          { _id: 'login:ip:1.2.3.4', attempts: 40 }
        ]
      })
    })
  })
}));

describe('recordAttempt', () => {
  it('gibt die Zähler in der Reihenfolge der Schlüssel zurück', async () => {
    const counts = await recordAttempt(['login:ip:1.2.3.4', 'login:mail:a@b.c', 'neu'], 15);

    expect(counts).toEqual([40, 11, 0]);
  });
});
