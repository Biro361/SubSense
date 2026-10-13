// src/lib/storage.js
import { getStore } from '@netlify/blobs';
import { writeFile, readFile, unlink, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Blob-Store mit expliziten Zugangsdaten: die Function läuft im Lambda-Modus
 * (adapter-netlify 5), dort gibt Netlify getStore('name') keinen Kontext mit.
 * SITE_ID setzt Netlify zur Laufzeit selbst, das Token ist ein Personal Access Token.
 */
function documentStore() {
  return getStore({
    name: 'contract-documents',
    siteID: env.SITE_ID,
    token: env.NETLIFY_BLOBS_TOKEN
  });
}

/**
 * Dokument hochladen (Netlify Blobs in Production, lokales Dateisystem in Dev)
 * @param {File} file - Hochgeladene Datei
 * @param {string} contractId - Vertrags-ID für Organisierung
 * @returns {Promise<{filename: string}>}
 */
export async function uploadDocument(file, contractId) {
  // Eindeutigen Dateinamen generieren
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${contractId}/${timestamp}-${sanitizedName}`;
  
  // Datei-Buffer lesen
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // dev steht beim Build fest. process.env.NETLIFY gibt es nur im Build,
  // nicht in der laufenden Function - damit landete Production auf der Platte.
  if (!dev) {
    // Production: Netlify Blobs verwenden
    const store = documentStore();

    await store.set(filename, buffer, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
        size: file.size.toString(),
        uploadDate: new Date().toISOString()
      }
    });
    
    return { filename };
    
  } else {
    // Development: Lokales Dateisystem verwenden
    const uploadDir = join(process.cwd(), 'static', 'uploads', contractId);
    
    // Verzeichnis erstellen falls nicht vorhanden
    await mkdir(uploadDir, { recursive: true });
    
    const localFilename = `${timestamp}-${sanitizedName}`;
    const filePath = join(uploadDir, localFilename);
    
    // Datei lokal speichern
    await writeFile(filePath, buffer);
    
    return { filename };
  }
}

/**
 * Dokument-Inhalt lesen (Blobs haben keine öffentliche URL)
 * @param {string} filename - Dateiname im Store (Format: contractId/timestamp-name.ext)
 * @returns {Promise<ReadableStream|Buffer|null>} null, wenn die Datei fehlt
 */
export async function readDocument(filename) {
  if (!dev) {
    return documentStore().get(filename, { type: 'stream' });
  }

  try {
    return await readFile(join(process.cwd(), 'static', 'uploads', filename));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return null;
  }
}

/**
 * Dokument aus Storage löschen
 * @param {string} filename - Dateiname im Store (Format: contractId/timestamp-name.ext)
 */
export async function deleteDocument(filename) {
  if (!dev) {
    // Production: Netlify Blobs
    const store = documentStore();
    await store.delete(filename);
    
  } else {
    // Development: Lokales Dateisystem
    const filePath = join(process.cwd(), 'static', 'uploads', filename);
    
    try {
      await unlink(filePath);
    } catch (err) {
      // Datei existiert nicht - ignorieren
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}

/**
 * Alle Dokumente eines Vertrags löschen (bei Vertrags-Löschung)
 * @param {string} contractId - Vertrags-ID
 */
export async function deleteAllContractDocuments(contractId) {
  if (!dev) {
    // Production: Netlify Blobs
    const store = documentStore();
    const { blobs } = await store.list({ prefix: `${contractId}/` });
    await Promise.all(blobs.map(blob => store.delete(blob.key)));
    
  } else {
    // Development: Lokales Dateisystem
    const uploadDir = join(process.cwd(), 'static', 'uploads', contractId);
    
    try {
      const files = await readdir(uploadDir);
      await Promise.all(
        files.map(file => unlink(join(uploadDir, file)))
      );
    } catch (err) {
      // Verzeichnis existiert nicht - ignorieren
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}