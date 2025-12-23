import { getContractById, deleteContract } from '$lib/db/contracts';
import { error, redirect, fail } from '@sveltejs/kit';

// Vertrag laden (mit User-Check)
export async function load({ params, locals }) {
  // User aus Session holen
  const user = locals.user;
  
  if (!user) {
    throw redirect(303, '/auth/signin');
  }
  
  // WICHTIG: userId als zweiten Parameter übergeben (Security!)
  const contract = await getContractById(params.id, user.userId);
  
  // Falls null → User ist nicht der Besitzer ODER Vertrag existiert nicht
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden oder keine Berechtigung');
  }
  
  return { contract };
}

// Form Action zum Löschen (mit User-Check)
export const actions = {
  default: async ({ params, locals }) => {
    // User aus Session holen
    const user = locals.user;
    
    if (!user) {
      return fail(401, { 
        success: false,
        error: 'Nicht eingeloggt' 
      });
    }
    
    try {
      // WICHTIG: userId als zweiten Parameter übergeben (Security!)
      const success = await deleteContract(params.id, user.userId);
      
      // Falls false → User ist nicht der Besitzer
      if (!success) {
        return fail(403, {
          success: false,
          error: 'Vertrag konnte nicht gelöscht werden (keine Berechtigung oder nicht gefunden)'
        });
      }
      
      throw redirect(303, '/?message=deleted');
      
    } catch (err) {
      if (err.status === 303) throw err;
      
      console.error('Delete error:', err);
      return fail(500, {
        success: false,
        error: 'Ein Fehler ist aufgetreten.'
      });
    }
  }
};
