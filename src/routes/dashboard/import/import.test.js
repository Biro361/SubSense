import { describe, it, expect, vi } from 'vitest';
import { actions } from './+page.server.js';

// redirect() wirft ein Redirect-Objekt. Der catch-Block der Action hat es früher
// verschluckt und nach einem geglückten Import "fehlgeschlagen" gemeldet.
const mocks = vi.hoisted(() => ({ createContracts: vi.fn() }));

vi.mock('$lib/db/contracts', () => ({ createContracts: mocks.createContracts }));

const CSV = 'name,provider,cancellationDate,status\nNetflix,Netflix Inc.,2026-03-15,active';

describe('import-Action', () => {
  it('leitet nach dem Import weiter, statt einen Fehler zu melden', async () => {
    mocks.createContracts.mockResolvedValue(1);

    const body = new FormData();
    body.set('csvContent', CSV);
    const event = {
      request: new Request('http://localhost/dashboard/import', { method: 'POST', body }),
      locals: { user: { userId: 'user1' } }
    };

    await expect(actions.import(event)).rejects.toMatchObject({
      status: 303,
      location: '/dashboard?message=import_success&count=1'
    });

    const [contracts, userId] = mocks.createContracts.mock.calls[0];
    expect(contracts).toHaveLength(1);
    expect(userId).toBe('user1');
  });
});
