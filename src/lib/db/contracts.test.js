import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
  deleteOne: vi.fn()
}));

vi.mock('$lib/mongodb', () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: mocks.findOne,
        updateOne: mocks.updateOne,
        deleteOne: mocks.deleteOne
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
