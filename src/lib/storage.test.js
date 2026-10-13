import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocument } from './storage.js';

// Der Production-Zweig läuft lokal sonst nie: `npm run dev` schreibt auf die Platte.
// Genau so blieb unbemerkt, dass Production ebenfalls auf der Platte landete.
const mocks = vi.hoisted(() => ({
  getStore: vi.fn(),
  set: vi.fn()
}));

vi.mock('$app/environment', () => ({ dev: false }));

vi.mock('$env/dynamic/private', () => ({
  env: { SITE_ID: 'site-1', NETLIFY_BLOBS_TOKEN: 'token-1' }
}));

vi.mock('@netlify/blobs', () => ({ getStore: mocks.getStore }));

const CONTRACT_ID = '507f1f77bcf86cd799439021';

describe('uploadDocument in Production', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStore.mockReturnValue({ set: mocks.set });
  });

  it('schreibt mit Site-ID und Token in den Blob-Store', async () => {
    const file = new File(['%PDF'], 'Vertrag 2026.pdf', { type: 'application/pdf' });

    const { filename } = await uploadDocument(file, CONTRACT_ID);

    expect(mocks.getStore).toHaveBeenCalledWith({
      name: 'contract-documents',
      siteID: 'site-1',
      token: 'token-1'
    });
    expect(filename).toMatch(new RegExp(`^${CONTRACT_ID}/\\d+-Vertrag_2026\\.pdf$`));
    expect(mocks.set).toHaveBeenCalledOnce();
    expect(mocks.set.mock.calls[0][0]).toBe(filename);
  });
});
