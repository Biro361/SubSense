import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMail, closeMail } from './mail.js';

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
  env: /** @type {Record<string, string | undefined>} */ ({})
}));

vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));

const CONFIG = {
  SMTP_USER: 'noreply@ik.me',
  SMTP_PASSWORD: 'geheim',
  MAIL_FROM: 'SubSense <noreply@ik.me>'
};

const MAIL = { to: 'nutzer@example.ch', subject: 'Betreff', text: 'Text' };

describe('sendMail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mocks.env)) delete mocks.env[key];
    Object.assign(mocks.env, CONFIG);
    mocks.createTransport.mockReturnValue({ sendMail: mocks.send, close: mocks.close });
    mocks.send.mockResolvedValue({ messageId: 'id' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Gecachten Transport verwerfen, damit jeder Test frisch beginnt
    closeMail();
    vi.restoreAllMocks();
  });

  it('verschickt über Infomaniak mit STARTTLS auf Port 587', async () => {
    await expect(sendMail(MAIL)).resolves.toBe(true);

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'mail.infomaniak.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: 'noreply@ik.me', pass: 'geheim' }
      })
    );
    expect(mocks.send).toHaveBeenCalledWith({
      from: 'SubSense <noreply@ik.me>',
      to: 'nutzer@example.ch',
      subject: 'Betreff',
      text: 'Text',
      html: undefined
    });
  });

  it('verwendet den Transport wieder, bis closeMail ihn schliesst', async () => {
    await sendMail(MAIL);
    await sendMail(MAIL);
    expect(mocks.createTransport).toHaveBeenCalledOnce();

    closeMail();
    expect(mocks.close).toHaveBeenCalledOnce();

    await sendMail(MAIL);
    expect(mocks.createTransport).toHaveBeenCalledTimes(2);
  });

  it('gibt bei einem Fehler false zurück und loggt nur die Codes', async () => {
    mocks.send.mockRejectedValue(
      Object.assign(new Error('Recipient address rejected: nutzer@example.ch'), {
        code: 'EENVELOPE',
        responseCode: 550
      })
    );

    await expect(sendMail(MAIL)).resolves.toBe(false);

    expect(console.error).toHaveBeenCalledWith('Mail error:', 'EENVELOPE', 550);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('nutzer@example.ch');
  });

  it('gibt ohne Konfiguration false zurück, ohne einen Transport anzulegen', async () => {
    delete mocks.env.SMTP_PASSWORD;

    await expect(sendMail(MAIL)).resolves.toBe(false);

    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('schreibt im Testmodus keinen fremden Empfänger an', async () => {
    mocks.env.MAIL_TEST_RECIPIENT = 'test@example.ch';

    await expect(sendMail(MAIL)).resolves.toBe(false);

    expect(mocks.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('Mail skipped (test mode)');
  });

  it('verschickt im Testmodus an die Testadresse, ohne auf Gross-/Kleinschreibung zu achten', async () => {
    mocks.env.MAIL_TEST_RECIPIENT = 'Test@Example.ch ';

    await expect(sendMail({ ...MAIL, to: 'test@example.CH' })).resolves.toBe(true);

    expect(mocks.send).toHaveBeenCalledOnce();
  });
});
