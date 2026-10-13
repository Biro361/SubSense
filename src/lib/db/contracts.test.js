import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createContracts,
  getContractById,
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
  insertMany: vi.fn()
}));

vi.mock('$lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: mocks.findOne,
        updateOne: mocks.updateOne,
        deleteOne: mocks.deleteOne,
        insertMany: mocks.insertMany
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
    expect(result.insertedCount).toBe(2);
    expect(result.errors).toEqual([]);

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

  it('meldet ungültige Zeilen und schreibt nur die gültigen', async () => {
    mocks.insertMany.mockResolvedValue({ insertedCount: 1 });

    const result = await createContracts([row, { ...row, name: '' }], 'user1');

    const [documents] = mocks.insertMany.mock.calls[0];
    expect(documents).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Zeile 2');
  });

  it('schreibt gar nicht, wenn keine Zeile gültig ist', async () => {
    const result = await createContracts([{ name: '' }, { name: '' }], 'user1');

    expect(mocks.insertMany).not.toHaveBeenCalled();
    expect(result.insertedCount).toBe(0);
    expect(result.errors).toHaveLength(2);
  });
});
