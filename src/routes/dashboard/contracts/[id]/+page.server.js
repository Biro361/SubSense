// src/routes/dashboard/contracts/[id]/+page.server.js
import { error, redirect } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { 
  getContractById, 
  updateNotes, 
  updateCancellationInstructions,
  addDocument,
  removeDocument
} from '$lib/db/contracts.js';
import { uploadDocument, deleteDocument as deleteStorageDocument } from '$lib/storage.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  // User aus locals.user verwenden (nicht locals.session)
  const user = locals.user;
  
  if (!user?.userId) {
    throw redirect(302, '/auth/signin');
  }

  const contract = await getContractById(params.id, user.userId);
  
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden oder keine Berechtigung');
  }
  
  // IDs sind bereits Strings (normalize), Daten überträgt SvelteKit als Date
  return { contract };
}

/** @type {import('./$types').Actions} */
export const actions = {
  // Notiz speichern
  updateNote: async ({ request, params, locals }) => {
    const user = locals.user;
    
    if (!user?.userId) {
      throw redirect(302, '/auth/signin');
    }

    const data = await request.formData();
    const notes = data.get('notes')?.toString() || '';
    
    try {
      if (!(await updateNotes(params.id, notes, user.userId))) {
        return { success: false, message: 'Vertrag nicht gefunden oder keine Berechtigung' };
      }
      return { success: true, message: 'Notiz gespeichert' };
    } catch (err) {
      console.error('Fehler beim Speichern der Notiz:', err);
      return { success: false, message: 'Fehler beim Speichern' };
    }
  },
  
  // Kündigungsanweisungen speichern
  updateInstructions: async ({ request, params, locals }) => {
    const user = locals.user;
    
    if (!user?.userId) {
      throw redirect(302, '/auth/signin');
    }

    const data = await request.formData();
    const instructions = data.get('instructions')?.toString() || '';
    const url = data.get('cancellationUrl')?.toString() || '';
    
    try {
      if (!(await updateCancellationInstructions(params.id, instructions, url, user.userId))) {
        return { success: false, message: 'Vertrag nicht gefunden oder keine Berechtigung' };
      }
      return { success: true, message: 'Kündigungsanweisungen gespeichert' };
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      return { success: false, message: err.message || 'Fehler beim Speichern' };
    }
  },
  
  // Dokument hochladen
  uploadDocument: async ({ request, params, locals }) => {
    const user = locals.user;
    
    if (!user?.userId) {
      throw redirect(302, '/auth/signin');
    }

    const data = await request.formData();
    const file = data.get('document');
    
    if (!file || file.size === 0) {
      return { success: false, message: 'Keine Datei ausgewählt' };
    }
    
    // 4 MB: Netlify nimmt pro Request rund 6 MB an, Uploads wachsen unterwegs um ein Drittel
    if (file.size > 4 * 1024 * 1024) {
      return { success: false, message: 'Datei zu gross (max. 4 MB)' };
    }
    
    // Dateityp-Validierung
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        message: 'Ungültiger Dateityp. Erlaubt: PDF, Word, JPG, PNG, WebP' 
      };
    }
    
    try {
      // Besitz vor dem Speichern prüfen: params.id wird als Ordnername benutzt
      const contract = await getContractById(params.id, user.userId);

      if (!contract) {
        return { success: false, message: 'Vertrag nicht gefunden oder keine Berechtigung' };
      }

      // Upload zu Netlify Blob
      const { filename } = await uploadDocument(file, params.id);

      // Metadata in MongoDB speichern
      const documentData = {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size
      };

      const added = await addDocument(params.id, documentData, user.userId);

      // Vertrag zwischenzeitlich gelöscht: Datei nicht als Waise liegen lassen
      if (!added) {
        await deleteStorageDocument(filename);
        return { success: false, message: 'Vertrag nicht gefunden oder keine Berechtigung' };
      }

      return { success: true, message: 'Dokument hochgeladen' };
    } catch (err) {
      console.error('Fehler beim Upload:', err);
      // err.message bleibt im Log: sie enthält Pfade und Zugangsfehler
      return { success: false, message: 'Upload fehlgeschlagen' };
    }
  },
  
  // Dokument löschen
  deleteDocument: async ({ request, params, locals }) => {
    const user = locals.user;
    
    if (!user?.userId) {
      throw redirect(302, '/auth/signin');
    }

    const data = await request.formData();
    const documentId = data.get('documentId')?.toString();

    if (!documentId) {
      return { success: false, message: 'Ungültige Dokument-Daten' };
    }

    try {
      // Dateiname nur aus dem eigenen Vertrag nehmen, nie aus dem Formular
      const contract = await getContractById(params.id, user.userId);
      const document = contract?.documents?.find(
        (doc) => doc._id.toString() === documentId
      );

      if (!document) {
        return { success: false, message: 'Dokument nicht gefunden' };
      }

      // Erst aus MongoDB, dann aus Storage: so bleibt kein toter Verweis zurück
      await removeDocument(params.id, documentId, user.userId);
      await deleteStorageDocument(document.filename);

      return { success: true, message: 'Dokument gelöscht' };
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      return { success: false, message: 'Löschen fehlgeschlagen' };
    }
  }
};