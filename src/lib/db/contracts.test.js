import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createContracts,
  getContractById,
  getContractsWithUpcomingDeadlines,
  markReminderSent,
  updateContract,
  deleteContract,
  updateNotes,
  updateCancellationInstructions,
  addDocument,
  removeDocument
} from './contracts.js';

// Eine kaputte ID darf nicht bis zu new ObjectId() kommen - das wirft und
// endete vorher als 500er statt als 404.
const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
  insertMany: vi.fn(),
  find: vi.fn(),
  toArray: vi.fn()
}));

vi.mock('$lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: mocks.findOne,
        updateOne: mocks.updateOne,
        deleteOne: mocks.deleteOne,
        insertMany: mocks.insertMany,
        find: mocks.find,
        createIndex: () => Promise.resolve('index')
      })
    })
  })
}));

const INVALID = 'keine-objectid';
const VALID_DOC = '507f1f77bcf86cd799439021';

describe('Schutz gegen ungültige IDs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getContractById gibt null zurück, ohne die DB zu fragen', async () => {
    await expect(getContractById(INVALID, 'user1')).resolves.toBeNull();
    expect(mocks.findOne).not.toHaveBeenCalled();
  });

  it.each([
    ['updateContract', () => updateContract(INVALID, { name: 'x' }, 'user1')],
    ['deleteContract', () => deleteContract(INVALID, 'user1')],
    ['updateNotes', () => updateNotes(INVALID, 'notiz', 'user1')],
    ['updateCancellationInstructions', () => updateCancellationInstructions(INVALID, 'a', '', 'user1')],
    ['markReminderSent', () => markReminderSent(INVALID, new Date(), new Date())],
    ['addDocument', () => addDocument(INVALID, { filename: 'x' }, 'user1')],
    ['removeDocument', () => removeDocument(INVALID, VALID_DOC, 'user1')]
  ])('%s gibt false zurück, ohne die DB zu ändern', async (_name, call) => {
    await expect(call()).resolves.toBe(false);
    expect(mocks.updateOne).not.toHaveBeenCalled();
    expect(mocks.deleteOne).not.toHaveBeenCalled();
  });

  it('removeDocument prüft auch die Dokument-ID', async () => {
    await expect(removeDocument(VALID_DOC, INVALID, 'user1')).resolves.toBe(false);
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });
});

describe('createContracts', () => {
  const row = {
    name: 'Netflix',
    provider: 'Netflix Inc.',
    cancellationDate: '2026-03-15',
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertMany.mockResolvedValue({ insertedCount: 2 });
  });

  it('schreibt alle Zeilen mit einem insertMany', async () => {
    const result = await createContracts([row, { ...row, name: 'Spotify' }], 'user1');

    expect(mocks.insertMany).toHaveBeenCalledOnce();
    expect(result).toBe(2);

    const [documents, options] = mocks.insertMany.mock.calls[0];
    expect(documents).toHaveLength(2);
    expect(options).toEqual({ ordered: false });
  });

  it('hängt userId als String an und setzt die Standardfelder', async () => {
    await createContracts([row], 'user1');

    const [[document]] = mocks.insertMany.mock.calls[0];
    expect(document.userId).toBe('user1');
    expect(document.documents).toEqual([]);
    expect(document.createdAt).toBeInstanceOf(Date);
    expect(document.cancellationDate).toBeInstanceOf(Date);
  });

  it('wirft bei einer ungültigen Zeile und schreibt nichts', async () => {
    await expect(createContracts([row, { ...row, name: '' }], 'user1')).rejects.toThrow('Name fehlt.');

    expect(mocks.insertMany).not.toHaveBeenCalled();
  });

  it('schreibt bei einer leeren Liste nicht', async () => {
    expect(await createContracts([], 'user1')).toBe(0);
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });
});

describe('getContractsWithUpcomingDeadlines', () => {
  const today = new Date('2026-10-21T00:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockReturnValue({ toArray: mocks.toArray });
    mocks.toArray.mockResolvedValue([
      {
        _id: { toString: () => 'c1' },
        userId: 'user1',
        name: 'Mobile Abo',
        cancellationDate: new Date('2026-10-30T00:00:00.000Z'),
        reminderDays: 14
      }
    ]);
  });

  it('sucht von heute bis heute + Fenster, inklusive beider Grenzen', async () => {
    await getContractsWithUpcomingDeadlines(today, 90);

    const [filter] = mocks.find.mock.calls[0];
    expect(filter.cancellationDate).toEqual({
      $gte: today,
      $lte: new Date('2027-01-19T00:00:00.000Z')
    });
  });

  it('schliesst gekündigte und bereits erinnerte Verträge aus', async () => {
    await getContractsWithUpcomingDeadlines(today, 90);

    const [filter] = mocks.find.mock.calls[0];
    expect(filter.status).toEqual({ $in: ['active', null] });
    expect(filter.reminderSentAt).toBeNull();
  });

  it('lädt weder Notizen noch Dokumente', async () => {
    await getContractsWithUpcomingDeadlines(today, 90);

    const [, { projection }] = mocks.find.mock.calls[0];
    expect(projection.notes).toBeUndefined();
    expect(projection.documents).toBeUndefined();
    expect(projection.userId).toBe(1);
  });

  it('behandelt Altbestand ohne Status als aktiv, auch für isUrgent', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T10:00:00.000Z'));
    mocks.toArray.mockResolvedValue([
      {
        _id: { toString: () => 'alt' },
        userId: 'user1',
        name: 'Altvertrag',
        cancellationDate: new Date('2026-10-25T00:00:00.000Z'),
        reminderDays: 7
      }
    ]);

    const [contract] = await getContractsWithUpcomingDeadlines(today, 90);
    vi.useRealTimers();

    expect(contract.status).toBe('active');
    expect(contract.isUrgent).toBe(true);
  });

  it('liefert Verträge mit userId und Erinnerungs-Metadaten', async () => {
    const [contract] = await getContractsWithUpcomingDeadlines(today, 90);

    expect(contract._id).toBe('c1');
    expect(contract.userId).toBe('user1');
    expect(contract.reminderDays).toBe(14);
    expect(contract.reminderDate).toBeInstanceOf(Date);
  });
});

describe('markReminderSent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('setzt reminderSentAt nur, wenn es noch fehlt und die Frist unverändert ist', async () => {
    const sentAt = new Date('2026-10-21T06:00:00.000Z');
    const deadline = new Date('2026-10-25T00:00:00.000Z');

    await expect(markReminderSent(VALID_DOC, sentAt, deadline)).resolves.toBe(true);

    const [filter, update] = mocks.updateOne.mock.calls[0];
    expect(filter.reminderSentAt).toBeNull();
    expect(filter.cancellationDate).toBe(deadline);
    expect(update).toEqual({ $set: { reminderSentAt: sentAt } });
  });
});

describe('updateContract und reminderSentAt', () => {
  const input = {
    name: 'Mobile Abo',
    provider: 'Swisscom',
    cancellationDate: '2026-12-31',
    status: 'active',
    reminderDays: 14
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('entfernt reminderSentAt nur bei geänderter Frist oder geändertem Vorlauf', async () => {
    await updateContract(VALID_DOC, input, 'user1');

    const [filter, update] = mocks.updateOne.mock.calls[0];
    expect(filter.userId).toBe('user1');
    expect(filter.$or).toEqual([
      { cancellationDate: { $ne: new Date('2026-12-31T00:00:00.000Z') } },
      { reminderDays: { $ne: 14 } }
    ]);
    expect(update).toEqual({ $unset: { reminderSentAt: '' } });
  });

  it('speichert die Felder danach wie bisher', async () => {
    await expect(updateContract(VALID_DOC, input, 'user1')).resolves.toBe(true);

    expect(mocks.updateOne).toHaveBeenCalledTimes(2);
    const [, update] = mocks.updateOne.mock.calls[1];
    expect(update.$set.reminderDays).toBe(14);
    expect(update.$set.reminderSentAt).toBeUndefined();
  });
});
