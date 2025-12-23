<script>
  import { enhance } from '$app/forms';
  
  let { data, form } = $props();
  let contract = $derived(data.contract);
</script>

<div class="max-w-md mx-auto p-6 mt-12">
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-xl font-bold mb-4">Vertrag löschen</h1>
    
    {#if form?.error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {form.error}
      </div>
    {/if}
    
    <p class="text-gray-600 mb-4">
      Möchtest du den folgenden Vertrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
    </p>
    
    <div class="bg-gray-50 rounded p-3 mb-6">
      <p class="font-semibold">{contract.name}</p>
      <p class="text-sm text-gray-600">{contract.provider}</p>
    </div>
    
    <form method="POST" use:enhance class="flex gap-3">
      <button
        type="submit"
        class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Ja, löschen
      </button>
      <a
        href="/"
        class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-center"
      >
        Abbrechen
      </a>
    </form>
  </div>
</div>
