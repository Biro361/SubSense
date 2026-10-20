import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './+server.js';

const SECRET = 'x'.repeat(40);

const mocks = vi.hoisted(() => ({
  env: /** @type {Record<string, string | undefined>} */ ({}),
  getContractsWithUpcomingDeadlines: vi.fn(),
  markReminderSent: vi.fn(),
  getUsersByIds: vi.fn(),
  getUserByEmail: vi.fn(),
  sendMail: vi.fn(),
  closeMail: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('$lib/db/contracts', () => ({
  getContractsWithUpcomingDeadlines: mocks.getContractsWithUpcomingDeadlines,
  markReminderSent: mocks.markReminderSent
}));
vi.mock('$lib/db/users', () => ({
  getUsersByIds: mocks.getUsersByIds,
  getUserByEmail: mocks.getUserByEmail
}));
vi.mock('$lib/server/mail', () => ({ sendMail: mocks.sendMail, closeMail: mocks.closeMail }));
vi.mock('$lib/reminders.js', () => ({ todayInZurich: () => '2026-10-21' }));

/**
 * Fälliger Vertrag in der Form von getContractsWithUpcomingDeadlines
 * @param {string} id
 * @param {Record<string, unknown>} [overrides]
 */
function contract(id, overrides = {}) {
  return {
    _id: id,
    userId: 'u1',
    name: `Vertrag ${id}`,
    provider: 'Swisscom',
    cancellationDate: new Date('2026-10-25T00:00:00.000Z'),
    cancellationUrl: null,
    daysUntilCancellation: 4,
    isUrgent: true,
    ...overrides
  };
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} [overrides]
 */
const user = (id, overrides = {}) => ({ _id: { toString: () => id }, email: `${id}@example.ch`, ...overrides });

/** @param {string | null} [authorization] */
function call(authorization = `Bearer ${SECRET}`) {
  /** @type {Record<string, string>} */
  const headers = authorization ? { authorization } : {};
  const request = new Request('http://localhost:5173/internal/send-reminders', { method: 'POST', headers });
  return POST(/** @type {any} */ ({ request, url: new URL(request.url) }));
}

describe('POST /internal/send-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mocks.env)) delete mocks.env[key];
    mocks.env.CRON_SECRET = SECRET;
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([contract('c1')]);
    mocks.getUsersByIds.mockResolvedValue([user('u1')]);
    mocks.sendMail.mockResolvedValue('sent');
    mocks.markReminderSent.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['ohne Schlüssel', null],
    ['mit falschem Schlüssel', `Bearer ${'y'.repeat(40)}`],
    ['mit Schlüssel ohne Bearer', SECRET]
  ])('lehnt %s mit 401 ab, ohne die DB zu fragen', async (_name, authorization) => {
    const response = await call(authorization);

    expect(response.status).toBe(401);
    expect(mocks.getContractsWithUpcomingDeadlines).not.toHaveBeenCalled();
  });

  it('lehnt ab, wenn CRON_SECRET fehlt oder zu kurz ist', async () => {
    mocks.env.CRON_SECRET = 'kurz';
    expect((await call('Bearer kurz')).status).toBe(401);

    delete mocks.env.CRON_SECRET;
    expect((await call('Bearer ')).status).toBe(401);
    expect(mocks.getContractsWithUpcomingDeadlines).not.toHaveBeenCalled();
  });

  it('sucht ab heute (Zürich) im 90-Tage-Fenster', async () => {
    await call();

    expect(mocks.getContractsWithUpcomingDeadlines).toHaveBeenCalledWith(
      new Date('2026-10-21T00:00:00.000Z'),
      90
    );
  });

  it('schickt pro fälligem Vertrag eine Mail und markiert ihn danach', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([
      contract('c1'),
      contract('c2', { isUrgent: false, daysUntilCancellation: 40 })
    ]);

    const response = await call();

    expect(await response.json()).toMatchObject({ checked: 2, due: 1, sent: 1, failed: 0 });
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    expect(mocks.sendMail.mock.calls[0][0].to).toBe('u1@example.ch');
    expect(mocks.markReminderSent).toHaveBeenCalledWith('c1', expect.any(Date));
    expect(mocks.closeMail).toHaveBeenCalledOnce();
  });

  it('lädt alle User in einer Abfrage', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([
      contract('c1'),
      contract('c2'),
      contract('c3', { userId: 'u2' })
    ]);
    mocks.getUsersByIds.mockResolvedValue([user('u1'), user('u2')]);

    await call();

    expect(mocks.getUsersByIds).toHaveBeenCalledOnce();
    expect(mocks.getUsersByIds).toHaveBeenCalledWith(['u1', 'u2']);
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
  });

  it('überspringt abbestellte und gelöschte User', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([
      contract('c1'),
      contract('c2', { userId: 'geloescht' })
    ]);
    mocks.getUsersByIds.mockResolvedValue([user('u1', { reminderEmails: false })]);

    const body = await (await call()).json();

    expect(body).toMatchObject({ sent: 0, skipped: 2 });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('markiert bei einem Versandfehler nichts', async () => {
    mocks.sendMail.mockResolvedValue('failed');

    const body = await (await call()).json();

    expect(body).toMatchObject({ sent: 0, failed: 1 });
    expect(mocks.markReminderSent).not.toHaveBeenCalled();
  });

  it('bricht nach drei Fehlschlägen in Folge ab', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue(
      ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => contract(id))
    );
    mocks.sendMail.mockResolvedValue('failed');

    const body = await (await call()).json();

    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
    expect(body).toMatchObject({ failed: 3, deferred: 2 });
  });

  it('läuft weiter, wenn das Markieren scheitert', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue(['c1', 'c2', 'c3'].map((id) => contract(id)));
    mocks.markReminderSent.mockRejectedValueOnce(new Error('Mongo timeout'));

    const response = await call();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
    expect(body).toMatchObject({ sent: 3, unmarked: 1 });
    expect(mocks.closeMail).toHaveBeenCalledOnce();
  });

  it('läuft bei abgelehnten Empfängern weiter, statt abzubrechen', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue(
      ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => contract(id))
    );
    mocks.sendMail
      .mockResolvedValueOnce('rejected')
      .mockResolvedValueOnce('rejected')
      .mockResolvedValueOnce('rejected')
      .mockResolvedValueOnce('rejected')
      .mockResolvedValueOnce('sent');

    const body = await (await call()).json();

    expect(mocks.sendMail).toHaveBeenCalledTimes(5);
    expect(body).toMatchObject({ failed: 4, sent: 1, deferred: 0 });
    expect(mocks.markReminderSent).toHaveBeenCalledOnce();
  });

  it('schickt höchstens 150 Mails pro Lauf', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue(
      Array.from({ length: 152 }, (_, i) => contract(`c${i}`))
    );

    const body = await (await call()).json();

    expect(mocks.sendMail).toHaveBeenCalledTimes(150);
    expect(body).toMatchObject({ sent: 150, deferred: 2 });
  });

  it('hört nach 20 Sekunden auf und lässt den Rest für morgen', async () => {
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue(['c1', 'c2', 'c3'].map((id) => contract(id)));
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    // Jede Mail dauert 15 s
    mocks.sendMail.mockImplementation(async () => {
      now += 15_000;
      return 'sent';
    });

    const body = await (await call()).json();

    expect(body).toMatchObject({ sent: 2, deferred: 1 });
  });

  it('verarbeitet im Testmodus nur Verträge des Testkontos', async () => {
    mocks.env.MAIL_TEST_RECIPIENT = 'u1@example.ch';
    mocks.getUserByEmail.mockResolvedValue(user('u1'));
    mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([
      contract('eigener'),
      contract('fremder', { userId: 'u2' })
    ]);

    const body = await (await call()).json();

    expect(console.warn).toHaveBeenCalledWith('Reminder run in test mode');
    expect(body).toMatchObject({ testMode: true, checked: 1, sent: 1 });
    expect(mocks.getUsersByIds).toHaveBeenCalledWith(['u1']);
    expect(mocks.markReminderSent).toHaveBeenCalledWith('eigener', expect.any(Date));
    expect(mocks.markReminderSent).not.toHaveBeenCalledWith('fremder', expect.anything());
  });

  it('macht im Testmodus ohne Testkonto nichts', async () => {
    mocks.env.MAIL_TEST_RECIPIENT = 'fehlt@example.ch';
    mocks.getUserByEmail.mockResolvedValue(null);

    await call();

    expect(mocks.getContractsWithUpcomingDeadlines).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  describe('Inhalt der Mail', () => {
    /** @param {Record<string, unknown>} overrides */
    async function mailFor(overrides) {
      mocks.getContractsWithUpcomingDeadlines.mockResolvedValue([contract('c1', overrides)]);
      await call();
      return mocks.sendMail.mock.calls[0][0];
    }

    it('nennt heute, morgen und die Anzahl Tage im Betreff', async () => {
      expect((await mailFor({ daysUntilCancellation: 0 })).subject).toBe('Kündigungsfrist heute: Vertrag c1');
      vi.clearAllMocks();
      expect((await mailFor({ daysUntilCancellation: 1 })).subject).toBe('Kündigungsfrist morgen: Vertrag c1');
      vi.clearAllMocks();
      expect((await mailFor({ daysUntilCancellation: 14 })).subject).toBe('Kündigungsfrist in 14 Tagen: Vertrag c1');
    });

    it('enthält Anbieter, Datum, Link in die App und den Abbestell-Hinweis', async () => {
      const { text } = await mailFor({});

      expect(text).toContain('Vertrag c1 bei Swisscom – kündbar bis 25.10.2026.');
      expect(text).toContain('In SubSense öffnen: http://localhost:5173/dashboard/contracts/c1');
      expect(text).toContain('Profil → Erinnerungen');
      expect(text).not.toContain('Kündigungsseite');
    });

    it('verlinkt die Kündigungsseite, wenn es eine gibt', async () => {
      const { text } = await mailFor({ cancellationUrl: 'https://example.ch/kuendigen' });

      expect(text).toContain('Zur Kündigungsseite: https://example.ch/kuendigen');
    });
  });
});
