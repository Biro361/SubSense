<script>
  import { page } from '$app/stores';
  
  let { data } = $props();
  let contracts = $derived(data.contracts || []);
  
  let message = $derived($page.url.searchParams.get('message'));
  
  let successMessage = $derived(
    message === 'created' ? 'Vertrag erfolgreich erstellt!' :
    message === 'updated' ? 'Vertrag erfolgreich aktualisiert!' :
    message === 'deleted' ? 'Vertrag erfolgreich gelöscht!' :
    null
  );
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">SubSense</h1>
      <p class="text-gray-600">Dein Vertrags-Radar</p>
    </div>
    <a
      href="/contracts/new"
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <span>+</span>
      Neuer Vertrag
    </a>
  </div>
  
  {#if successMessage}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      {successMessage}
    </div>
  {/if}
  
  <h2 class="text-xl font-semibold mb-4">Alle Verträge ({contracts.length})</h2>
  
  {#if contracts.length === 0}
    <div class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">Noch keine Verträge vorhanden.</p>
      <a
        href="/contracts/new"
        class="text-blue-600 hover:text-blue-800 font-medium"
      >
        Ersten Vertrag erstellen
      </a>
    </div>
  {:else}
    <div class="grid gap-4">
      {#each contracts as contract}
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold">{contract.name}</h3>
              <p class="text-gray-600">Anbieter: {contract.provider}</p>
              <p class="text-sm text-gray-500">
                Kündigung möglich bis: {new Date(contract.cancellationDate).toLocaleDateString('de-DE')}
              </p>
            </div>
            
            <span class="{contract.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm h-fit">
              {contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}
            </span>
          </div>
          
          <div class="flex gap-2 mt-4 pt-4 border-t">
            <a
              href="/contracts/{contract._id}/edit"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Bearbeiten
            </a>
            <a
              href="/contracts/{contract._id}/delete"
              class="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Löschen
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
