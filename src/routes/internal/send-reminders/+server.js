import { json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { getContractsWithUpcomingDeadlines, markReminderSent } from '$lib/db/contracts';
import { getUserByEmail, getUsersByIds } from '$lib/db/users';
import { sendMail, closeMail } from '$lib/server/mail';
import { todayInZurich } from '$lib/reminders.js';

// Grösstes erlaubtes reminderDays: weiter vorne kann keine Erinnerung fällig sein
const WINDOW_DAYS = 90;

// shortcut: 150 Mails und 20 s pro Lauf, der Rest folgt am nächsten Tag. Infomaniak erlaubt
// 200 Mails pro 24 h für die ganze Adresse (Reserve für Passwort-Reset), der Auslöser wartet
// höchstens 30 s. Ausbauen (mehrere Läufe pro Tag), sobald regelmässig mehr fällig ist.
const MAX_MAILS_PER_RUN = 150;
const TIME_BUDGET_MS = 20_000;

// Drei Systemfehler in Folge heissen: Server weg, Passwort falsch oder Adresse gesperrt.
// Abgelehnte Empfänger zählen nicht, sonst hielten drei falsche Adressen den Lauf jeden Tag an.
const MAX_FAILURES_IN_ROW = 3;

// Ein kurzer Schlüssel ist so gut wie keiner
const MIN_SECRET_LENGTH = 32;

/**
 * Zeitkonstanter Vergleich des Bearer-Schlüssels
 * @param {Request} request
 */
function isAuthorized(request) {
  const secret = env.CRON_SECRET ?? '';
  if (secret.length < MIN_SECRET_LENGTH) return false;

  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** @param {number} days */
function formatDays(days) {
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  return `in ${days} Tagen`;
}

/**
 * @param {{ _id: string, name: string, provider?: string, cancellationDate: Date, daysUntilCancellation: number, cancellationUrl?: string | null }} contract
 * @param {string} to
 * @param {string} origin - Basis für den Link in die App
 */
function buildReminderMail(contract, to, origin) {
  // Gespeichert als UTC-Mitternacht: in UTC formatieren, sonst rutscht das Datum
  const deadline = new Date(contract.cancellationDate).toLocaleDateString('de-CH', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const provider = contract.provider ? ` bei ${contract.provider}` : '';

  const text = [
    `${contract.name}${provider} – kündbar bis ${deadline}.`,
    '',
    ...(contract.cancellationUrl ? [`Zur Kündigungsseite: ${contract.cancellationUrl}`] : []),
    `In SubSense öffnen: ${origin}/dashboard/contracts/${contract._id}`,
    '',
    'Erinnerungen abbestellen: in SubSense unter Profil → Erinnerungen.'
  ].join('\n');

  return {
    to,
    subject: `Kündigungsfrist ${formatDays(contract.daysUntilCancellation)}: ${contract.name}`,
    text
  };
}

/**
 * POST /internal/send-reminders
 * Verschickt die fälligen Erinnerungen. Aufgerufen einmal täglich von
 * netlify/functions/send-reminders.mjs. Liegt bewusst nicht unter /api: der Hook
 * leitet dort ohne Session auf die Anmeldung um. Einzige Schranke ist der Schlüssel.
 */
/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url }) {
  if (!isAuthorized(request)) {
    return json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const started = Date.now();
  const summary = { checked: 0, due: 0, sent: 0, failed: 0, skipped: 0, deferred: 0, unmarked: 0, testMode: false };

  try {
    // Testläufe arbeiten mit der Produktionsdatenbank: nur Verträge des Testkontos anfassen
    const testRecipient = env.MAIL_TEST_RECIPIENT?.trim();
    let testUserId = null;
    if (testRecipient) {
      summary.testMode = true;
      console.warn('Reminder run in test mode');
      const testUser = await getUserByEmail(testRecipient);
      if (!testUser) {
        console.log('Reminder run:', JSON.stringify(summary));
        return json(summary);
      }
      testUserId = testUser._id.toString();
    }

    const today = new Date(`${todayInZurich()}T00:00:00.000Z`);
    let contracts = await getContractsWithUpcomingDeadlines(today, WINDOW_DAYS);
    if (testUserId) {
      contracts = contracts.filter((contract) => contract.userId === testUserId);
    }
    summary.checked = contracts.length;

    // Fällig = im Erinnerungszeitraum und Frist noch nicht vorbei
    const due = contracts.filter((contract) => contract.isUrgent);
    summary.due = due.length;

    const users = await getUsersByIds([...new Set(due.map((contract) => contract.userId))]);
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));

    let failuresInRow = 0;
    try {
      for (const [index, contract] of due.entries()) {
        const outOfBudget =
          summary.sent + summary.failed >= MAX_MAILS_PER_RUN || Date.now() - started > TIME_BUDGET_MS;
        if (outOfBudget || failuresInRow >= MAX_FAILURES_IN_ROW) {
          summary.deferred = due.length - index;
          break;
        }

        const user = usersById.get(contract.userId);
        // Gelöschter User oder abbestellt (fehlendes Feld = an)
        if (!user || user.reminderEmails === false) {
          summary.skipped++;
          continue;
        }

        const result = await sendMail(buildReminderMail(contract, user.email, url.origin));
        if (result === 'sent') {
          summary.sent++;
          failuresInRow = 0;
          // Erst nach Erfolg markieren: ein Ausfall wird am nächsten Tag wiederholt
          try {
            await markReminderSent(contract._id, new Date());
          } catch (error) {
            // Die Mail ist schon draussen: weitermachen, sonst fallen alle übrigen für heute aus.
            // Dieser Vertrag kommt morgen ein zweites Mal.
            console.error('Reminder mark error:', error);
            summary.unmarked++;
          }
        } else {
          summary.failed++;
          if (result === 'failed') failuresInRow++;
        }
      }
    } finally {
      closeMail();
    }

    console.log('Reminder run:', JSON.stringify({ ...summary, durationMs: Date.now() - started }));
    return json(summary);
  } catch (error) {
    console.error('Reminder run error:', error);
    return json({ error: 'Erinnerungs-Lauf fehlgeschlagen' }, { status: 500 });
  }
}
