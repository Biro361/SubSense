import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { actions, _MIN_RESPONSE_MS } from './+page.server.js';
import {
  RESET_MAX_REQUESTS,
  RESET_IP_MAX_REQUESTS,
  RESET_MAILS_MAX_PER_DAY
} from '$lib/db/rateLimit.js';

const mocks = vi.hoisted(() => ({
  env: /** @type {Record<string, string | undefined>} */ ({}),
  recordAttempt: vi.fn(),
  getUserByEmail: vi.fn(),
  createPasswordReset: vi.fn(),
  sendMail: vi.fn(),
  closeMail: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('$lib/db/rateLimit.js', async (importOriginal) => ({
  ...(await importOriginal()),
  recordAttempt: mocks.recordAttempt
}));
vi.mock('$lib/db/users', () => ({ getUserByEmail: mocks.getUserByEmail }));
vi.mock('$lib/db/passwordResets.js', () => ({
  createPasswordReset: mocks.createPasswordReset,
  RESET_TOKEN_MINUTES: 30
}));
vi.mock('$lib/server/mail', () => ({ sendMail: mocks.sendMail, closeMail: mocks.closeMail }));
vi.mock('$lib/mongodb', () => ({ getDatabase: vi.fn() }));

const KNOWN = 'konto@example.com';
const USER = { _id: { toString: () => '507f1f77bcf86cd799439011' }, email: KNOWN };

/**
 * @param {string} email
 * @returns {Promise<any>}
 */
function forgot(email, origin = 'http://localhost') {
  const body = new FormData();
  body.set('email', email);

  return actions.default(
    /** @type {any} */ ({
      request: new Request(`${origin}/auth/forgot`, { method: 'POST', body }),
      getClientAddress: () => '1.2.3.4'
    })
  );
}

/**
 * Führt die Action aus und hält fest, ob sie vor der Mindestdauer fertig war
 * @param {string} email
 */
async function timedForgot(email, origin = 'http://localhost') {
  let settled = false;
  const promise = forgot(email, origin).then((result) => {
    settled = true;
    return result;
  });

  await vi.advanceTimersByTimeAsync(_MIN_RESPONSE_MS - 1);
  const settledEarly = settled;
  await vi.advanceTimersByTimeAsync(1);

  return { result: await promise, settledEarly, settled };
}

describe('Passwort vergessen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    mocks.env.SITE_URL = 'https://subsense1.netlify.app/';
    mocks.recordAttempt.mockResolvedValue([1, 1]);
    mocks.getUserByEmail.mockImplementation(async (email) => (email === KNOWN ? USER : null));
    mocks.createPasswordReset.mockResolvedValue('token-123');
    mocks.sendMail.mockResolvedValue('sent');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('antwortet für bekannte und unbekannte Adressen gleich und gleich lang', async () => {
    const known = await timedForgot(KNOWN);
    const unknown = await timedForgot('niemand@example.com');

    expect(known.result).toEqual({ sent: true });
    expect(unknown.result).toEqual(known.result);
    expect([known.settledEarly, unknown.settledEarly]).toEqual([false, false]);
    expect([known.settled, unknown.settled]).toEqual([true, true]);
  });

  it('verschickt nur für ein bestehendes Konto eine Mail', async () => {
    await timedForgot('niemand@example.com');
    expect(mocks.sendMail).not.toHaveBeenCalled();

    await timedForgot(KNOWN);
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    expect(mocks.sendMail.mock.calls[0][0].to).toBe(KNOWN);
    expect(mocks.closeMail).toHaveBeenCalledOnce();
  });

  it('baut den Link aus SITE_URL, nicht aus dem Host der Anfrage', async () => {
    await timedForgot(KNOWN, 'https://boese.example');

    const { text } = mocks.sendMail.mock.calls[0][0];
    expect(text).toContain('https://subsense1.netlify.app/auth/reset?token=token-123');
    expect(text).not.toContain('boese.example');
  });

  it('antwortet bei einem Versandfehler gleich und gleich lang', async () => {
    mocks.sendMail.mockResolvedValue('failed');
    const failed = await timedForgot(KNOWN);

    expect(failed).toEqual({ result: { sent: true }, settledEarly: false, settled: true });
  });

  it('antwortet bei einem Datenbankfehler gleich und loggt ohne Adresse', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.createPasswordReset.mockRejectedValue(new Error('db down'));

    const failed = await timedForgot(KNOWN);

    expect(failed).toEqual({ result: { sent: true }, settledEarly: false, settled: true });
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(KNOWN);
    consoleError.mockRestore();
  });

  it('verschickt ohne SITE_URL nichts', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.env.SITE_URL = undefined;

    const { result } = await timedForgot(KNOWN);

    expect(result).toEqual({ sent: true });
    expect(mocks.createPasswordReset).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('sperrt über dem Limit pro Adresse mit neutraler Meldung, ohne das Konto zu suchen', async () => {
    mocks.recordAttempt.mockResolvedValue([1, RESET_MAX_REQUESTS + 1]);

    const result = await forgot(KNOWN);

    expect(result.status).toBe(429);
    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });

  it('sperrt eine IP erst über ihrem eigenen, höheren Limit', async () => {
    mocks.recordAttempt.mockResolvedValue([RESET_MAX_REQUESTS + 1, 1]);
    expect((await timedForgot(KNOWN)).result).toEqual({ sent: true });

    mocks.recordAttempt.mockResolvedValue([RESET_IP_MAX_REQUESTS + 1, 1]);
    expect((await forgot(KNOWN)).status).toBe(429);
  });

  it('verschickt über dem Tageslimit aller Reset-Mails nichts, antwortet aber gleich', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.recordAttempt
      .mockResolvedValueOnce([1, 1])
      .mockResolvedValueOnce([RESET_MAILS_MAX_PER_DAY + 1]);

    const limited = await timedForgot(KNOWN);

    expect(limited).toEqual({ result: { sent: true }, settledEarly: false, settled: true });
    expect(mocks.createPasswordReset).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('zählt für das Tageslimit nur Anfragen, die eine Mail auslösen', async () => {
    await timedForgot('niemand@example.com');

    expect(mocks.recordAttempt).toHaveBeenCalledOnce();
    expect(mocks.recordAttempt.mock.calls[0][0]).not.toContain('reset:mails:all');
  });

  it('verlangt eine E-Mail-Adresse', async () => {
    const result = await forgot('  ');

    expect(result.status).toBe(400);
    expect(mocks.recordAttempt).not.toHaveBeenCalled();
  });
});
