<script>
  import { enhance } from '$app/forms';
  
  let { data, form } = $props();
  let contract = $derived(data.contract);
  
  // Datum für Input-Feld formatieren (YYYY-MM-DD)
  let formattedDate = $derived(
    contract.cancellationDate 
      ? new Date(contract.cancellationDate).toISOString().split('T')[0]
      : ''
  );
</script>

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Vertrag bearbeiten</h1>
  
  {#if form?.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {form.error}
    </div>
  {/if}
  
  <form method="POST" use:enhance class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium mb-1">
        Vertragsname *
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={contract.name}
        required
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label for="provider" class="block text-sm font-medium mb-1">
        Anbieter *
      </label>
      <input
        type="text"
        id="provider"
        name="provider"
        value={contract.provider}
        required
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label for="cancellationDate" class="block text-sm font-medium mb-1">
        Kündigungsfrist *
      </label>
      <input
        type="date"
        id="cancellationDate"
        name="cancellationDate"
        value={formattedDate}
        required
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <!-- NEU: Kosten -->
    <div>
      <label for="cost" class="block text-sm font-medium mb-1">
        Kosten (CHF) *
      </label>
      <input
        type="number"
        id="cost"
        name="cost"
        value={contract.cost || 0}
        step="0.01"
        min="0"
        required
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <!-- NEU: Abrechnungszyklus -->
    <div>
      <label for="billingCycle" class="block text-sm font-medium mb-1">
        Abrechnungszyklus *
      </label>
      <select
        id="billingCycle"
        name="billingCycle"
        value={contract.billingCycle || 'monthly'}
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="monthly">Monatlich</option>
        <option value="quarterly">Vierteljährlich</option>
        <option value="yearly">Jährlich</option>
      </select>
    </div>
    
    <div>
      <label for="status" class="block text-sm font-medium mb-1">
        Status *
      </label>
      <select
        id="status"
        name="status"
        value={contract.status}
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="active">Aktiv</option>
        <option value="cancelled">Gekündigt</option>
      </select>
    </div>
    
    <div class="flex gap-3 pt-4">
      <button
        type="submit"
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Speichern
      </button>
      <a
        href="/"
        class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
      >
        Abbrechen
      </a>
    </div>
  </form>
</div>
