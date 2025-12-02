<!-- src/routes/+page.svelte -->
<script>
  import { contracts } from '$lib/stores/contracts.js';

    // Hilfsfunktion für Währungsformatierung
  /** @param {number} amount */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
  };

</script>

<div class="p-8 max-w-4xl mx-auto">
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-800">SubSense Dashboard</h1>
    <p class="text-gray-600">Deine Abos im Überblick</p>
  </header>

  <!-- Karten-Raster für die Verträge -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    
    {#each $contracts as contract}
      <div class="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-semibold text-gray-900">{contract.name}</h2>
          <span class="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
            {contract.category}
          </span>
        </div>
        
        <div class="space-y-2 text-gray-700">
          <p class="flex justify-between">
            <span>Kosten:</span>
            <span class="font-medium">{formatCurrency(contract.cost)} / {contract.cycle === 'monatlich' ? 'Mt.' : 'Jr.'}</span>
          </p>
          <p class="flex justify-between text-sm">
            <span>Nächste Fälligkeit:</span>
            <span>{contract.nextDueDate}</span>
          </p>
        </div>
      </div>
    {/each}

  </div>
</div>
