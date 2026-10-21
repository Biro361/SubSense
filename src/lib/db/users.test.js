import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { MongoServerError } from 'mongodb';
import { deleteUser, resetUserPassword, updateUserEmail, updateUserPassword } from './users.js';
import { deleteAllContractDocuments } from '$lib/storage.js';

// Geprüft wird der Filter, mit dem deleteUser arbeitet - genau dort lag der Bug:
// contracts speichert userId als String, gefiltert wurde mit einer ObjectId.
const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  deleteOne: vi.fn(),
  updateOne: vi.fn(),
  findOne: vi.fn(),
  toArray: vi.fn(),
  deleteAllContractDocuments: vi.fn(),
  deletePasswordResets: vi.fn()
}));

vi.mock('$lib/mongodb', () => ({
  getDatabase: vi.fn(async () => ({
    collection: () => ({
      find: () => ({ toArray: mocks.toArray }),
      findOne: mocks.findOne,
      createIndex: async () => 'email_1',
      deleteMany: mocks.deleteMany,
      deleteOne: mocks.deleteOne,
      updateOne: mocks.updateOne
    })
  }))
}));

vi.mock('$lib/storage.js', () => ({
  deleteAllContractDocuments: mocks.deleteAllContractDocuments
}));

vi.mock('$lib/db/passwordResets.js', () => ({
  deletePasswordResets: mocks.deletePasswordResets
}));

const USER_ID = '507f1f77bcf86cd799439011';

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toArray.mockResolvedValue([
      { _id: new ObjectId('507f1f77bcf86cd799439021') },
      { _id: new ObjectId('507f1f77bcf86cd799439022') }
    ]);
  });

  it('löscht die Verträge mit userId als String', async () => {
    await deleteUser(USER_ID);

    expect(mocks.deleteMany).toHaveBeenCalledWith({ userId: USER_ID });
    expect(typeof mocks.deleteMany.mock.calls[0][0].userId).toBe('string');
  });

  it('löscht die Dokumente jedes Vertrags', async () => {
    await deleteUser(USER_ID);

    expect(deleteAllContractDocuments).toHaveBeenCalledTimes(2);
    expect(deleteAllContractDocuments).toHaveBeenCalledWith('507f1f77bcf86cd799439021');
    expect(deleteAllContractDocuments).toHaveBeenCalledWith('507f1f77bcf86cd799439022');
  });

  it('löscht die Dokumente vor den Verträgen, sonst sind die IDs weg', async () => {
    await deleteUser(USER_ID);

    const documentsFirst = mocks.deleteAllContractDocuments.mock.invocationCallOrder[0];
    const contractsAfter = mocks.deleteMany.mock.invocationCallOrder[0];

    expect(documentsFirst).toBeLessThan(contractsAfter);
  });

  it('löscht den User selbst über seine ObjectId', async () => {
    await deleteUser(USER_ID);

    expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(USER_ID) });
  });

  it('tut bei einer ungültigen ID nichts', async () => {
    await deleteUser('keine-objectid');

    expect(deleteAllContractDocuments).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    expect(mocks.deleteOne).not.toHaveBeenCalled();
  });

  it('kommt mit einem User ohne Verträge aus', async () => {
    mocks.toArray.mockResolvedValue([]);

    await deleteUser(USER_ID);

    expect(deleteAllContractDocuments).not.toHaveBeenCalled();
    expect(mocks.deleteMany).toHaveBeenCalledWith({ userId: USER_ID });
    expect(mocks.deleteOne).toHaveBeenCalledOnce();
  });
});

describe('resetUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('setzt das neue Passwort gehasht', async () => {
    expect(await resetUserPassword(USER_ID, 'neuesPasswort1')).toBe(true);

    const [filter, update] = mocks.updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: new ObjectId(USER_ID) });
    expect(update.$set.password).not.toBe('neuesPasswort1');
    expect(await bcrypt.compare('neuesPasswort1', update.$set.password)).toBe(true);
  });

  it('erhöht tokenVersion, damit alle Sessions enden', async () => {
    await resetUserPassword(USER_ID, 'neuesPasswort1');

    expect(mocks.updateOne.mock.calls[0][1].$inc).toEqual({ tokenVersion: 1 });
  });

  it('meldet false, wenn es den User nicht mehr gibt', async () => {
    mocks.updateOne.mockResolvedValue({ matchedCount: 0 });

    expect(await resetUserPassword(USER_ID, 'neuesPasswort1')).toBe(false);
  });

  it('ändert bei einer ungültigen ID nichts', async () => {
    expect(await resetUserPassword('keine-objectid', 'neuesPasswort1')).toBe(false);
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });
});

describe('offene Reset-Links nach Konto-Änderungen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toArray.mockResolvedValue([]);
    mocks.updateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('verwirft sie nach einer neuen E-Mail-Adresse', async () => {
    expect(await updateUserEmail(USER_ID, 'neu@example.com')).toBe(true);

    expect(mocks.deletePasswordResets).toHaveBeenCalledWith(USER_ID);
  });

  it('lässt sie stehen, wenn die neue Adresse schon vergeben ist', async () => {
    mocks.updateOne.mockRejectedValue(new MongoServerError({ code: 11000, errmsg: 'duplicate' }));

    expect(await updateUserEmail(USER_ID, 'vergeben@example.com')).toBe(false);
    expect(mocks.deletePasswordResets).not.toHaveBeenCalled();
  });

  it('verwirft sie nach einem neuen Passwort im Profil', async () => {
    mocks.findOne.mockResolvedValue({ password: await bcrypt.hash('altesPasswort1', 4) });

    expect(await updateUserPassword(USER_ID, 'altesPasswort1', 'neuesPasswort1')).toBe(true);
    expect(mocks.deletePasswordResets).toHaveBeenCalledWith(USER_ID);
  });

  it('lässt sie stehen, wenn das alte Passwort falsch ist', async () => {
    mocks.findOne.mockResolvedValue({ password: await bcrypt.hash('altesPasswort1', 4) });

    expect(await updateUserPassword(USER_ID, 'falsch', 'neuesPasswort1')).toBe(false);
    expect(mocks.deletePasswordResets).not.toHaveBeenCalled();
  });

  it('verwirft sie beim Löschen des Kontos', async () => {
    await deleteUser(USER_ID);

    expect(mocks.deletePasswordResets).toHaveBeenCalledWith(USER_ID);
  });
});
