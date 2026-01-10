<script>
  import { enhance } from "$app/forms";
  import { CATEGORIES } from "$lib/constants";

  let { data, form } = $props();
  let contract = $derived(data.contract);

  // Datum für Input-Feld formatieren (YYYY-MM-DD)
  let formattedDate = $derived(
    contract.cancellationDate
      ? new Date(contract.cancellationDate).toISOString().split("T")[0]
      : "",
  );

  // Erinnerungstage State
  let reminderDays = $state(contract.reminderDays || 7);

  // Kategorie State
  let category = $state(contract.category || "other");

  // Preset-Button Handler
  function setReminderPreset(days) {
    reminderDays = days;
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Vertrag bearbeiten</h1>

  {#if form?.error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
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
      <label for="category" class="block text-sm font-medium mb-1">
        Kategorie *
      </label>
      <select
        id="category"
        name="category"
        bind:value={category}
        required
        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        {#each CATEGORIES as cat}
          <option value={cat.value}>{cat.icon} {cat.label}</option>
        {/each}
      </select>
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

    <!-- NEU: Erinnerung -->
    <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <label
        for="reminderDays"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        🔔 Erinnerung (Tage vorher) *
      </label>

      <!-- Preset-Buttons -->
      <div class="flex gap-2 mb-3">
        <button
          type="button"
          onclick={() => setReminderPreset(3)}
          class="px-3 py-1 rounded {reminderDays === 3
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}"
        >
          3 Tage
        </button>
        <button
          type="button"
          onclick={() => setReminderPreset(7)}
          class="px-3 py-1 rounded {reminderDays === 7
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}"
        >
          7 Tage
        </button>
        <button
          type="button"
          onclick={() => setReminderPreset(14)}
          class="px-3 py-1 rounded {reminderDays === 14
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}"
        >
          14 Tage
        </button>
        <button
          type="button"
          onclick={() => setReminderPreset(30)}
          class="px-3 py-1 rounded {reminderDays === 30
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}"
        >
          30 Tage
        </button>
      </div>

      <input
        type="number"
        id="reminderDays"
        name="reminderDays"
        bind:value={reminderDays}
        min="1"
        max="90"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p class="text-sm text-gray-600 mt-2">
        💡 Du wirst <strong>{reminderDays} Tage</strong> vor der Kündigungsfrist
        erinnert.
      </p>
    </div>

    <!-- Kosten -->
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

    <!-- Abrechnungszyklus -->
    <div>
      <label for="billingCycle" class="block text-sm font-medium mb-1">
        Abrechnungszyklus *
      </label>
      <select
        id="billingCycle"
        name="billingCycle"
        value={contract.billingCycle || "monthly"}
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
