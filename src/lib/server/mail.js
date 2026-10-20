import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// Keine Geheimnisse: Server und Port von Infomaniak. Nie Port 25, den sperrt AWS Lambda.
const SMTP_HOST = 'mail.infomaniak.com';
const SMTP_PORT = 587;

// Ein hängender Server darf die Function nicht bis zu ihrem Zeitlimit blockieren
const TIMEOUT_MS = 10_000;

/** @type {import('nodemailer').Transporter | null} */
let transporter = null;
let missingConfigLogged = false;

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // STARTTLS auf 587: unverschlüsselt verbinden, dann TLS erzwingen
    secure: false,
    requireTLS: true,
    // Eine Verbindung für den ganzen Erinnerungs-Lauf statt TLS-Aufbau pro Mail
    pool: true,
    maxConnections: 1,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS
  });
  return transporter;
}

/**
 * Eine Mail über Infomaniak verschicken.
 * Ist MAIL_TEST_RECIPIENT gesetzt, geht nur an genau diese Adresse etwas raus:
 * Testläufe arbeiten mit der Produktionsdatenbank und dürfen echte Nutzer nicht anschreiben.
 * @param {{ to: string, subject: string, text: string, html?: string }} mail
 * @returns {Promise<boolean>} true, wenn der Server die Mail angenommen hat
 */
export async function sendMail({ to, subject, text, html }) {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
    // Lokal ohne Zugang soll die App weiterlaufen, das Log aber nicht fluten
    if (!missingConfigLogged) {
      console.error('Mail error: SMTP_USER, SMTP_PASSWORD or MAIL_FROM is missing');
      missingConfigLogged = true;
    }
    return false;
  }

  const testRecipient = env.MAIL_TEST_RECIPIENT?.trim().toLowerCase();
  if (testRecipient && to.trim().toLowerCase() !== testRecipient) {
    console.warn('Mail skipped (test mode)');
    return false;
  }

  try {
    await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, text, html });
    return true;
  } catch (error) {
    // Nur Codes: die Meldung des Servers kann die Empfängeradresse enthalten
    const { code, responseCode } = /** @type {{ code?: string, responseCode?: number }} */ (error ?? {});
    console.error('Mail error:', code, responseCode);
    return false;
  }
}

/**
 * Offene SMTP-Verbindung schliessen. Nach jedem Lauf aufrufen: Netlify friert die
 * Function danach ein, und eine tote Verbindung liesse die nächste erste Mail scheitern.
 */
export function closeMail() {
  transporter?.close();
  transporter = null;
}
