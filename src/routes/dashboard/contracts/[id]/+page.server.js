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
  const session = locals.session;
  
  if (!session?.user?.id) {
    throw redirect(302, '/auth/login');
  }

  const contract = await getContractById(params.id, session.user.id);
  
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden oder keine Berechtigung');
  }
  
  return {
    contract: {
      ...contract,
      cancellationDate: contract.cancellationDate instanceof Date 
        ? contract.cancellationDate.toISOString().split('T')[0]
        : contract.cancellationDate,
      documents: contract.documents?.map(doc => ({
        ...doc,
        _id: doc._id.toString(),
        uploadDate: doc.uploadDate instanceof Date
          ? doc.uploadDate.toISOString()
          : doc.uploadDate
      })) || []
    }
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  // Notiz speichern
  updateNote: async ({ request, params, locals }) => {
    const session = locals.session;
    
    if (!session?.user?.id) {
      throw redirect(302, '/auth/login');
    }

    const data = await request.formData();
    const notes = data.get('notes')?.toString() || '';
    
    try {
      await updateNotes(params.id, notes, session.user.id);
      return { success: true, message: 'Notiz gespeichert' };
    } catch (err) {
      console.error('Fehler beim Speichern der Notiz:', err);
      return { success: false, message: 'Fehler beim Speichern' };
    }
  },
  
  // Kündigungsanweisungen speichern
  updateInstructions: async ({ request, params, locals }) => {
    const session = locals.session;
    
    if (!session?.user?.id) {
      throw redirect(302, '/auth/login');
    }

    const data = await request.formData();
    const instructions = data.get('instructions')?.toString() || '';
    const url = data.get('cancellationUrl')?.toString() || '';
    
    try {
      await updateCancellationInstructions(params.id, instructions, url, session.user.id);
      return { success: true, message: 'Kündigungsanweisungen gespeichert' };
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      return { success: false, message: err.message || 'Fehler beim Speichern' };
    }
  },
  
  // Dokument hochladen
  uploadDocument: async ({ request, params, locals }) => {
    const session = locals.session;
    
    if (!session?.user?.id) {
      throw redirect(302, '/auth/login');
    }

    const data = await request.formData();
    const file = data.get('document');
    
    if (!file || file.size === 0) {
      return { success: false, message: 'Keine Datei ausgewählt' };
    }
    
    // Dateigrösse limitieren (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: 'Datei zu gross (max. 5 MB)' };
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
      // Upload zu Netlify Blob
      const { url, filename } = await uploadDocument(file, params.id);
      
      // Metadata in MongoDB speichern
      const documentData = {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url
      };
      
      await addDocument(params.id, documentData, session.user.id);
      
      return { success: true, message: 'Dokument hochgeladen' };
    } catch (err) {
      console.error('Fehler beim Upload:', err);
      return { success: false, message: 'Upload fehlgeschlagen: ' + err.message };
    }
  },
  
  // Dokument löschen
  deleteDocument: async ({ request, params, locals }) => {
    const session = locals.session;
    
    if (!session?.user?.id) {
      throw redirect(302, '/auth/login');
    }

    const data = await request.formData();
    const documentId = data.get('documentId')?.toString();
    const filename = data.get('filename')?.toString();
    
    if (!documentId || !filename) {
      return { success: false, message: 'Ungültige Dokument-Daten' };
    }
    
    try {
      // Aus Storage löschen
      await deleteStorageDocument(filename);
      
      // Aus MongoDB löschen
      await removeDocument(params.id, documentId, session.user.id);
      
      return { success: true, message: 'Dokument gelöscht' };
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      return { success: false, message: 'Löschen fehlgeschlagen' };
    }
  }
};