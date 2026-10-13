import { describe, it, expect, vi } from 'vitest';
import { handle } from './hooks.server.js';

// Ein Token mit alter tokenVersion muss nach einem Passwortwechsel wertlos sein.
const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  clearSessionCookie: vi.fn(),
  getUserById: vi.fn()
}));

vi.mock('$lib/server/auth.js', () => ({
  verifyToken: mocks.verifyToken,
  clearSessionCookie: mocks.clearSessionCookie
}));
vi.mock('$lib/db/users.js', () => ({ getUserById: mocks.getUserById }));

function run(payload, user) {
  mocks.verifyToken.mockReturnValue(payload);
  mocks.getUserById.mockResolvedValue(user);

  const event = {
    url: new URL('http://localhost/dashboard'),
    cookies: { get: () => 'token' },
    locals: {}
  };

  return handle({ event, resolve: (e) => e.locals });
}

describe('handle', () => {
  it('meldet den User bei passender tokenVersion an', async () => {
    const locals = await run({ userId: 'u1', email: 'a@b.c', tokenVersion: 2 }, { tokenVersion: 2 });

    expect(locals.user).toEqual({ userId: 'u1', email: 'a@b.c', tokenVersion: 2 });
  });

  it('verwirft ein Token mit älterer tokenVersion und löscht das Cookie', async () => {
    mocks.clearSessionCookie.mockClear();

    const locals = await run({ userId: 'u1', email: 'a@b.c', tokenVersion: 1 }, { tokenVersion: 2 });

    expect(locals.user).toBeUndefined();
    expect(mocks.clearSessionCookie).toHaveBeenCalledOnce();
  });

  it('verwirft das Token eines gelöschten Users', async () => {
    const locals = await run({ userId: 'u1', email: 'a@b.c', tokenVersion: 0 }, null);

    expect(locals.user).toBeUndefined();
  });
});
