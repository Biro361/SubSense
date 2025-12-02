<!-- src/routes/+page.svelte -->
<script>
    import { contracts } from '$lib/stores/contracts.js';

  // --- NEU: Modal-Status und Formular-Daten ---
  let showModal = false;

  /** @type {{name:string; cost:number; cycle:'monatlich'|'jährlich'; nextDueDate:string; cancellationNotice:number; category:string}} */
  let newContract = {
    name: '',
    cost: 0,
    cycle: 'monatlich',
    nextDueDate: '',            // leer lassen
    cancellationNotice: 30,     // Pflichtfeld vorhanden
    category: 'Sonstiges'
  };

  /** @param {number} amount */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
  };

  // Funktion zum Speichern
  const addContract = () => {
    if (!newContract.name || !newContract.cost) return; // Einfache Validierung

    // Aktualisiere den Store
    contracts.update(current => [
      ...current, 
      { ...newContract, id: Date.now() } // Neue ID generieren
    ]);

    // Reset & Schließen
    showModal = false;
    newContract = { name: '', cost: 0, cycle: 'monatlich', nextDueDate: '', category: 'Sonstiges' };
  };

</script>

<div class="p-8 max-w-4xl mx-auto">
      <header class="mb-8 flex justify-between items-end">
    <div>
      <h1 class="text-3xl font-bold text-gray-800">SubSense Dashboard</h1>
      <p class="text-gray-600">Deine Abos im Überblick</p>
    </div>
    <button 
      on:click={() => showModal = true}
      class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
      + Abo hinzufügen
    </button>
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

  <!-- MODAL -->
  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Neues Abo erfassen</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" bind:value={newContract.name} class="mt-1 block w-full border border-gray-300 rounded p-2" placeholder="z.B. Netflix">
          </div>

          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700">Kosten (CHF)</label>
              <input type="number" bind:value={newContract.cost} class="mt-1 block w-full border border-gray-300 rounded p-2">
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700">Zyklus</label>
              <select bind:value={newContract.cycle} class="mt-1 block w-full border border-gray-300 rounded p-2">
                <option value="monatlich">Monatlich</option>
                <option value="jährlich">Jährlich</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nächste Fälligkeit</label>
            <input type="date" bind:value={newContract.nextDueDate} class="mt-1 block w-full border border-gray-300 rounded p-2">
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button on:click={() => showModal = false} class="text-gray-500 hover:text-gray-700 px-4 py-2">Abbrechen</button>
          <button on:click={addContract} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Speichern</button>
        </div>
      </div>
    </div>
  {/if}

