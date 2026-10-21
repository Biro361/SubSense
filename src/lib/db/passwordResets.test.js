import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPasswordReset, consumePasswordReset, RESET_TOKEN_MINUTES } from './passwordResets.js';

// Kleine Collection im Speicher: prüft, dass die Filter das Richtige treffen
const store = vi.hoisted(() => ({ docs: /** @type {any[]} */ ([]) }));

vi.mock('$lib/mongodb', () => ({
  getDatabase: vi.fn(async () => ({
    collection: () => ({
      createIndex: async () => 'expiresAt_1',
      replaceOne: async (/** @type {any} */ filter, /** @type {any} */ doc) => {
        store.docs = store.docs.filter((d) => d.userId !== filter.userId);
        store.docs.push(doc);
      },
      findOneAndDelete: async (/** @type {any} */ filter) => {
        const index = store.docs.findIndex(
          (d) => d.tokenHash === filter.tokenHash && d.expiresAt > filter.expiresAt.$gt
        );
        return index === -1 ? null : store.docs.splice(index, 1)[0];
      }
    })
  }))
}));

const USER_ID = '507f1f77bcf86cd799439011';

describe('Passwort-Reset-Token', () => {
  beforeEach(() => {
    store.docs = [];
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt beim Einlösen eines gültigen Tokens die userId zurück', async () => {
    const token = await createPasswordReset(USER_ID);

    expect(await consumePasswordReset(token)).toBe(USER_ID);
  });

  it('lässt sich nur einmal einlösen', async () => {
    const token = await createPasswordReset(USER_ID);

    await consumePasswordReset(token);
    expect(await consumePasswordReset(token)).toBeNull();
  });

  it('gilt nach Ablauf nicht mehr', async () => {
    const token = await createPasswordReset(USER_ID);

    vi.advanceTimersByTime(RESET_TOKEN_MINUTES * 60 * 1000 + 1);
    expect(await consumePasswordReset(token)).toBeNull();
  });

  it('lehnt ein falsches oder leeres Token ab', async () => {
    await createPasswordReset(USER_ID);

    expect(await consumePasswordReset('falsch')).toBeNull();
    expect(await consumePasswordReset('')).toBeNull();
  });

  it('macht ein älteres Token mit dem neuen ungültig', async () => {
    const first = await createPasswordReset(USER_ID);
    const second = await createPasswordReset(USER_ID);

    expect(await consumePasswordReset(first)).toBeNull();
    expect(await consumePasswordReset(second)).toBe(USER_ID);
  });

  it('speichert das Token nur gehasht', async () => {
    const token = await createPasswordReset(USER_ID);

    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(Object.values(store.docs[0])).not.toContain(token);
  });
});
