import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions, load } from './+page.server.js';

const mocks = vi.hoisted(() => ({ consumePasswordReset: vi.fn(), resetUserPassword: vi.fn() }));

vi.mock('$lib/db/passwordResets.js', () => ({ consumePasswordReset: mocks.consumePasswordReset }));
vi.mock('$lib/db/users', () => ({ resetUserPassword: mocks.resetUserPassword }));
vi.mock('$lib/mongodb', () => ({ getDatabase: vi.fn() }));

const USER_ID = '507f1f77bcf86cd799439011';

/**
 * @param {Record<string, string>} fields
 * @returns {Promise<any>}
 */
function reset(fields) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);

  return actions.default(
    /** @type {any} */ ({ request: new Request('http://localhost/auth/reset', { method: 'POST', body }) })
  );
}

const VALID = { token: 'token-123', password: 'neuesPasswort1', passwordConfirm: 'neuesPasswort1' };

describe('Neues Passwort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumePasswordReset.mockResolvedValue(USER_ID);
    mocks.resetUserPassword.mockResolvedValue(true);
  });

  it('löst das Token beim Laden der Seite nicht ein', () => {
    const data = load(/** @type {any} */ ({ url: new URL('http://localhost/auth/reset?token=token-123') }));

    expect(data).toEqual({ token: 'token-123' });
    expect(mocks.consumePasswordReset).not.toHaveBeenCalled();
  });

  it('setzt das Passwort und leitet zur Anmeldung mit Erfolgsmeldung', async () => {
    await expect(reset(VALID)).rejects.toMatchObject({
      status: 303,
      location: '/auth/signin?message=password-reset'
    });
    expect(mocks.resetUserPassword).toHaveBeenCalledWith(USER_ID, 'neuesPasswort1');
  });

  it('lehnt ungleiche Passwörter ab, ohne den Link zu verbrauchen', async () => {
    const result = await reset({ ...VALID, passwordConfirm: 'anderesPasswort' });

    expect(result.status).toBe(400);
    expect(mocks.consumePasswordReset).not.toHaveBeenCalled();
  });

  it('lehnt ein zu kurzes Passwort ab, ohne den Link zu verbrauchen', async () => {
    const result = await reset({ ...VALID, password: 'kurz', passwordConfirm: 'kurz' });

    expect(result.status).toBe(400);
    expect(mocks.consumePasswordReset).not.toHaveBeenCalled();
  });

  it('meldet einen ungültigen oder abgelaufenen Link', async () => {
    mocks.consumePasswordReset.mockResolvedValue(null);

    const result = await reset(VALID);

    expect(result.status).toBe(400);
    expect(result.data.invalidLink).toBe(true);
    expect(mocks.resetUserPassword).not.toHaveBeenCalled();
  });

  it('meldet einen fehlenden Link', async () => {
    const result = await reset({ ...VALID, token: '' });

    expect(result.data.invalidLink).toBe(true);
    expect(mocks.consumePasswordReset).not.toHaveBeenCalled();
  });

  it('meldet einen gelöschten User als ungültigen Link', async () => {
    mocks.resetUserPassword.mockResolvedValue(false);

    const result = await reset(VALID);

    expect(result.data.invalidLink).toBe(true);
  });
});
