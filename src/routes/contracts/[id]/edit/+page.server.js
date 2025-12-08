import { getContractById, updateContract } from '$lib/db/contracts';
import { error, redirect } from '@sveltejs/kit';

// Vertrag beim Seitenaufruf laden
export async function load({ params }) {
  const contract = await getContractById(params.id);
  
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden');
  }
  
  return { contract };
}

// Form Action für Update
export const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    
    const updates = {
      name: formData.get('name'),
      provider: formData.get('provider'),
      cancellationDate: new Date(formData.get('cancellationDate')),
      status: formData.get('status')
    };
    
    // Validierung
    if (!updates.name || !updates.provider || !updates.cancellationDate) {
      return {
        success: false,
        error: 'Bitte fülle alle Pflichtfelder aus.'
      };
    }
    
    try {
      const success = await updateContract(params.id, updates);
      
      if (!success) {
        return {
          success: false,
          error: 'Vertrag konnte nicht aktualisiert werden.'
        };
      }
      
      throw redirect(303, '/?message=updated');
    } catch (err) {
      if (err.status === 303) throw err; // Redirect durchreichen
      
      console.error('Update error:', err);
      return {
        success: false,
        error: 'Ein Fehler ist aufgetreten.'
      };
    }
  }
};
