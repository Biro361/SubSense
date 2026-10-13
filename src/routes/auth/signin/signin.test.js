import { describe, it, expect, vi } from 'vitest';
import { actions } from './+page.server.js';
import { LOGIN_MAX_ATTEMPTS, LOGIN_IP_MAX_ATTEMPTS } from '$lib/db/rateLimit.js';

const mocks = vi.hoisted(() => ({ recordAttempt: vi.fn(), getUserByEmail: vi.fn() }));

vi.mock('$lib/db/rateLimit.js', async (importOriginal) => ({
  ...(await importOriginal()),
  recordAttempt: mocks.recordAttempt,
  clearAttempts: vi.fn()
}));
vi.mock('$lib/db/users', () => ({ getUserByEmail: mocks.getUserByEmail }));
vi.mock('$lib/server/auth.js', () => ({ setSessionCookie: vi.fn() }));
vi.mock('$lib/mongodb', () => ({ getDatabase: vi.fn() }));

function login() {
  const body = new FormData();
  body.set('email', 'a@b.c');
  body.set('password', 'geheim123');

  return actions.default({
    request: new Request('http://localhost/auth/signin', { method: 'POST', body }),
    cookies: {},
    getClientAddress: () => '1.2.3.4'
  });
}

describe('Login-Limit', () => {
  it('sperrt den 11. Versuch auf eine Email, ohne das Passwort zu prüfen', async () => {
    mocks.recordAttempt.mockResolvedValue([1, LOGIN_MAX_ATTEMPTS + 1]);

    expect((await login()).status).toBe(429);
    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });

  it('sperrt eine IP erst über ihrem eigenen, höheren Limit', async () => {
    mocks.getUserByEmail.mockResolvedValue(null);

    mocks.recordAttempt.mockResolvedValue([LOGIN_MAX_ATTEMPTS + 1, 1]);
    expect((await login()).status).toBe(401);

    mocks.recordAttempt.mockResolvedValue([LOGIN_IP_MAX_ATTEMPTS + 1, 1]);
    expect((await login()).status).toBe(429);
  });
});
