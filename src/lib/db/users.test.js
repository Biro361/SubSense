import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { deleteUser, resetUserPassword } from './users.js';
import { deleteAllContractDocuments } from '$lib/storage.js';

// Geprüft wird der Filter, mit dem deleteUser arbeitet - genau dort lag der Bug:
// contracts speichert userId als String, gefiltert wurde mit einer ObjectId.
const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  deleteOne: vi.fn(),
  updateOne: vi.fn(),
  toArray: vi.fn(),
  deleteAllContractDocuments: vi.fn()
}));

vi.mock('$lib/mongodb', () => ({
  getDatabase: vi.fn(async () => ({
    collection: () => ({
      find: () => ({ toArray: mocks.toArray }),
      deleteMany: mocks.deleteMany,
      deleteOne: mocks.deleteOne,
      updateOne: mocks.updateOne
    })
  }))
}));

vi.mock('$lib/storage.js', () => ({
  deleteAllContractDocuments: mocks.deleteAllContractDocuments
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
