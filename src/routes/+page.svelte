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
  
  // Kostenberechnungen - nur aktive Verträge
  let activeContracts = $derived(contracts.filter(c => c.status === 'active'));
  
  // Monatliche Gesamtkosten (normalisiert)
  let totalMonthlyCost = $derived(
    activeContracts.reduce((sum, contract) => {
      const cost = contract.cost || 0;
      const cycle = contract.billingCycle || 'monthly';
      
      // Auf monatliche Kosten normalisieren
      let monthlyCost = cost;
      if (cycle === 'yearly') monthlyCost = cost / 12;
      if (cycle === 'quarterly') monthlyCost = cost / 3;
      
      return sum + monthlyCost;
    }, 0)
  );
  
  // Jährliche Gesamtkosten
  let totalYearlyCost = $derived(totalMonthlyCost * 12);
  
  // Abrechnungszyklus formatieren
  function formatBillingCycle(cycle) {
    switch(cycle) {
      case 'monthly': return 'Monat';
      case 'yearly': return 'Jahr';
      case 'quarterly': return 'Quartal';
      default: return 'Monat';
    }
  }
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
  
  <!-- Kosten-Dashboard -->
  {#if activeContracts.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p class="text-sm text-gray-600 mb-1">Monatliche Kosten</p>
        <p class="text-2xl font-bold text-blue-600">
          {totalMonthlyCost.toFixed(2)} CHF
        </p>
        <p class="text-xs text-gray-500 mt-1">Durchschnitt pro Monat</p>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <p class="text-sm text-gray-600 mb-1">Jährliche Kosten</p>
        <p class="text-2xl font-bold text-purple-600">
          {totalYearlyCost.toFixed(2)} CHF
        </p>
        <p class="text-xs text-gray-500 mt-1">Hochgerechnet aufs Jahr</p>
      </div>
      
      <div class="bg-green-50 rounded-lg p-4 border border-green-200">
        <p class="text-sm text-gray-600 mb-1">Aktive Verträge</p>
        <p class="text-2xl font-bold text-green-600">
          {activeContracts.length}
        </p>
        <p class="text-xs text-gray-500 mt-1">Von {contracts.length} gesamt</p>
      </div>
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
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{contract.name}</h3>
              <p class="text-gray-600">Anbieter: {contract.provider}</p>
              <p class="text-sm text-gray-500">
                Kündigung möglich bis: {new Date(contract.cancellationDate).toLocaleDateString('de-DE')}
              </p>
              
              <!-- NEU: Kostenanzeige -->
              {#if contract.cost && contract.cost > 0}
                <p class="text-sm font-medium text-blue-600 mt-2">
                  {contract.cost.toFixed(2)} CHF / {formatBillingCycle(contract.billingCycle)}
                </p>
              {:else}
                <p class="text-sm text-gray-400 mt-2 italic">
                  Keine Kosten angegeben
                </p>
              {/if}
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
