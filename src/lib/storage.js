// src/lib/storage.js
import { getStore } from '@netlify/blobs';

/**
 * Dokument zu Netlify Blob Store hochladen
 * @param {File} file - Hochgeladene Datei
 * @param {string} contractId - Vertrags-ID für Organisierung
 * @returns {Promise<{url: string, filename: string}>}
 */
export async function uploadDocument(file, contractId) {
  const store = getStore('contract-documents');
  
  // Eindeutigen Dateinamen generieren (Timestamp + Original-Name)
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sonderzeichen entfernen
  const filename = `${contractId}/${timestamp}-${sanitizedName}`;
  
  // Datei-Buffer lesen
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Upload zu Netlify Blob mit Metadata
  await store.set(filename, buffer, {
    metadata: {
      contentType: file.type,
      originalName: file.name,
      size: file.size.toString(),
      uploadDate: new Date().toISOString()
    }
  });
  
  // Öffentliche URL generieren
  const url = await store.getURL(filename);
  
  return { url, filename };
}

/**
 * Dokument aus Storage löschen
 * @param {string} filename - Dateiname im Store
 */
export async function deleteDocument(filename) {
  const store = getStore('contract-documents');
  await store.delete(filename);
}

/**
 * Alle Dokumente eines Vertrags löschen (bei Vertrags-Löschung)
 * @param {string} contractId - Vertrags-ID
 */
export async function deleteAllContractDocuments(contractId) {
  const store = getStore('contract-documents');
  
  // Liste aller Dateien im Vertragspfad abrufen
  const { blobs } = await store.list({ prefix: `${contractId}/` });
  
  // Alle Dateien löschen
  await Promise.all(
    blobs.map(blob => store.delete(blob.key))
  );
}