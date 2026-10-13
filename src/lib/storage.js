// src/lib/storage.js
import { getStore } from '@netlify/blobs';
import { writeFile, readFile, unlink, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { dev } from '$app/environment';

// Prüfe ob wir in Netlify Production laufen
const isNetlify = process.env.NETLIFY === 'true';

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
  
  if (isNetlify && !dev) {
    // Production: Netlify Blobs verwenden
    const store = getStore('contract-documents');
    
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
  if (isNetlify && !dev) {
    return getStore('contract-documents').get(filename, { type: 'stream' });
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
  if (isNetlify && !dev) {
    // Production: Netlify Blobs
    const store = getStore('contract-documents');
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
  if (isNetlify && !dev) {
    // Production: Netlify Blobs
    const store = getStore('contract-documents');
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