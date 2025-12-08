import { getContractById, deleteContract } from '$lib/db/contracts';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params }) {
  const contract = await getContractById(params.id);
  
  if (!contract) {
    throw error(404, 'Vertrag nicht gefunden');
  }
  
  return { contract };
}

export const actions = {
  default: async ({ params }) => {
    try {
      const success = await deleteContract(params.id);
      
      if (!success) {
        return {
          success: false,
          error: 'Vertrag konnte nicht gelöscht werden.'
        };
      }
      
      throw redirect(303, '/?message=deleted');
    } catch (err) {
      if (err.status === 303) throw err;
      
      console.error('Delete error:', err);
      return {
        success: false,
        error: 'Ein Fehler ist aufgetreten.'
      };
    }
  }
};
