import { error } from '@sveltejs/kit';
import { getContractById } from '$lib/db/contracts.js';
import { readDocument } from '$lib/storage.js';

/**
 * GET: Dokument eines eigenen Vertrags ausliefern
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
  // Das Dashboard-Layout schützt nur Seiten, keine +server.js-Endpunkte
  const userId = locals.user?.userId;
  if (!userId) {
    throw error(401, 'Nicht eingeloggt');
  }

  // Dateiname nur aus dem eigenen Vertrag nehmen, nie aus der URL
  const contract = await getContractById(params.id, userId);
  const document = contract?.documents.find((doc) => doc._id === params.docId);
  const body = document && (await readDocument(document.filename));

  if (!body) {
    throw error(404, 'Dokument nicht gefunden');
  }

  return new Response(body, {
    headers: {
      'Content-Type': document.mimeType,
      // mimeType kommt vom Browser des Uploads: nicht raten lassen
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
      'Cache-Control': 'private, no-store'
    }
  });
}
