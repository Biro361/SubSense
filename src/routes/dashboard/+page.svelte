<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { CATEGORIES, getCategoryByValue, monthlyCost } from "$lib/constants";
  import { goto } from '$app/navigation';
  import Toast from "$lib/components/Toast.svelte";

  let { data } = $props();
  let contracts = $derived(data.contracts || []);

  let message = $derived($page.url.searchParams.get("message"));
  let importCount = $derived($page.url.searchParams.get("count"));

  let successMessage = $derived(
    message === "created"
      ? "Vertrag erfolgreich erstellt!"
      : message === "updated"
        ? "Vertrag erfolgreich aktualisiert!"
        : message === "deleted"
          ? "Vertrag erfolgreich gelöscht!"
          : message === "import_success"
            ? `${importCount ?? "0"} Verträge erfolgreich importiert!`
            : null,
  );

  // Filter-State
  let selectedCategory = $state("all");
  // Suchfilter-State
  let searchQuery = $state("");

  // Gefilterte Verträge (kombiniert Kategorie + Suche)
  let filteredContracts = $derived.by(() => {
    // 1. Kategorie-Filter anwenden
    let result = selectedCategory === "all"
      ? contracts
      : contracts.filter((c) => c.category === selectedCategory);

    // 2. Suchfilter anwenden (nur wenn searchQuery nicht leer)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      
      result = result.filter((contract) => {
        // Suche in: Name, Anbieter, Status
        const nameMatch = contract.name?.toLowerCase().includes(query);
        const providerMatch = contract.provider?.toLowerCase().includes(query);
        const statusMatch = (contract.status === "active" ? "aktiv" : "gekündigt").includes(query);
        
        return nameMatch || providerMatch || statusMatch;
      });
    }

    return result;
  });

  // Toast-State
  let showToast = $state(false);
  let toastMessage = $state("");

  // Toast anzeigen; die Komponente blendet sich nach 5 Sekunden selbst aus
  onMount(() => {
    if (successMessage) {
      toastMessage = successMessage;
      showToast = true;

      // URL bereinigen (ohne ?message=...)
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      url.searchParams.delete("count");
      window.history.replaceState({}, "", url);
    }
  });

  // Verträge nach Dringlichkeit sortieren (dringend zuerst)
  let sortedContracts = $derived(
    [...filteredContracts].sort((a, b) => {
      // Dringende zuerst
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      // Dann nach Kündigungsdatum
      return new Date(a.cancellationDate) - new Date(b.cancellationDate);
    }),
  );

  // Dringende Verträge filtern
  let urgentContracts = $derived(contracts.filter((c) => c.isUrgent));

  // Überfällige Verträge filtern (höchste Priorität)
  let overdueContracts = $derived(contracts.filter((c) => c.isOverdue));

  // Kostenberechnungen - nur aktive Verträge
  let activeContracts = $derived(
    contracts.filter((c) => c.status === "active"),
  );

  // Monatliche Gesamtkosten (normalisiert)
  let totalMonthlyCost = $derived(
    activeContracts.reduce((sum, contract) => sum + monthlyCost(contract), 0),
  );

  // Jährliche Gesamtkosten
  let totalYearlyCost = $derived(totalMonthlyCost * 12);

  // Abrechnungszyklus formatieren
  function formatBillingCycle(cycle) {
    switch (cycle) {
      case "monthly":
        return "Monat";
      case "yearly":
        return "Jahr";
      case "quarterly":
        return "Quartal";
      default:
        return "Monat";
    }
  }

  // Tage-Text formatieren
  function formatDaysText(days) {
    if (days === 0) return "Heute";
    if (days === 1) return "Morgen";
    if (days < 0) return `Überfällig (${Math.abs(days)} Tage)`;
    return `Noch ${days} Tage`;
  }

  // Statistiken pro Kategorie
  let categoryStats = $derived(
    CATEGORIES.map((cat) => {
      const categoryContracts = contracts.filter(
        (c) => c.category === cat.value,
      );
      const count = categoryContracts.length;
      const categoryMonthlyCost = categoryContracts
        .filter((c) => c.status === "active")
        .reduce((sum, c) => sum + monthlyCost(c), 0);

      return {
        ...cat,
        count,
        monthlyCost: categoryMonthlyCost.toFixed(2),
      };
    }),
  );
  
  // Navigation zur Detailansicht
  function navigateToDetails(contractId) {
    goto(`/dashboard/contracts/${contractId}`);
  }
</script>

{#if showToast}
  <Toast message={toastMessage} onClose={() => (showToast = false)} />
{/if}

<!-- Karte für überfällige (overdue) und dringende Verträge -->
{#snippet alertCard(contract, overdue)}
  <div
    class="{overdue
      ? 'bg-red-100 border-red-500 shadow-lg'
      : 'bg-red-50 border-red-200 shadow'} border-2 rounded-lg p-4"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-lg font-semibold {overdue ? 'text-gray-900' : ''}">
            {contract.name}
          </h3>
          <span
            class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold"
          >
            {overdue ? "ÜBERFÄLLIG" : "DRINGEND"}
          </span>
        </div>
        <p class="{overdue ? 'text-gray-800' : 'text-gray-700'} font-medium">
          Anbieter: {contract.provider}
        </p>

        {#if contract.cancellationUrl}
          <a
            href={contract.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              ></path>
            </svg>
            Zur Kündigungsseite
          </a>
        {/if}

        {#if overdue}
          <div class="mt-3 p-3 bg-white rounded border-2 border-red-500">
            <p class="text-sm font-semibold text-red-700 mb-1">
              ⚠️ Kündigungsfrist überschritten:
            </p>
            <p class="text-xl font-bold text-red-700">
              {formatDaysText(contract.daysUntilCancellation)}
            </p>
            <p class="text-sm font-medium text-gray-700 mt-2">
              Frist war am: <span class="font-semibold"
                >{new Date(contract.cancellationDate).toLocaleDateString(
                  "de-DE",
                )}</span
              >
            </p>
            <p class="text-xs text-red-600 mt-2 italic">
              💡 Tipp: Prüfe die Vertragsbedingungen. Möglicherweise wurde
              der Vertrag automatisch verlängert.
            </p>
          </div>
        {:else}
          <div class="mt-3 p-3 bg-white rounded border border-red-300">
            <p class="text-sm font-medium text-gray-700 mb-1">
              Kündigungsfrist:
            </p>
            <p class="text-xl font-bold text-red-600">
              {formatDaysText(contract.daysUntilCancellation)}
            </p>
            <p class="text-sm font-medium text-gray-600 mt-1">
              bis <span class="font-semibold"
                >{new Date(contract.cancellationDate).toLocaleDateString(
                  "de-DE",
                )}</span
              >
            </p>
          </div>
        {/if}

        {#if contract.cost && contract.cost > 0}
          <p class="text-sm font-medium text-blue-600 mt-3">
            {contract.cost.toFixed(2)} CHF / {formatBillingCycle(
              contract.billingCycle,
            )}
          </p>
        {/if}
      </div>

      <span
        class="{overdue || contract.status !== 'active'
          ? 'bg-gray-100 text-gray-800'
          : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm h-fit"
      >
        {contract.status === "active" ? "Aktiv" : "Gekündigt"}
      </span>
    </div>

    {#if overdue}
      <div class="flex gap-2 mt-4 pt-4 border-t border-red-300">
        <a
          href="/dashboard/contracts/{contract._id}"
          class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm font-medium"
        >
          Details anzeigen
        </a>
        <a
          href="/dashboard/contracts/{contract._id}/edit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
        >
          Status aktualisieren
        </a>
        <a
          href="/dashboard/contracts/{contract._id}/delete"
          class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium"
        >
          Löschen
        </a>
      </div>
    {:else}
      <div class="flex gap-2 mt-4 pt-4 border-t border-red-200">
        <a
          href="/dashboard/contracts/{contract._id}"
          class="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          👁️ Details
        </a>
        <a
          href="/dashboard/contracts/{contract._id}/edit"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ✏️ Bearbeiten
        </a>
        <a
          href="/dashboard/contracts/{contract._id}/delete"
          class="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          🗑️ Löschen
        </a>
      </div>
    {/if}
  </div>
{/snippet}

<!-- Dashboard-Content (Header ist jetzt im Layout) -->
<div class="max-w-4xl mx-auto p-6">
  <!-- Suchleiste -->
  <div class="mb-6">
    <label for="search" class="block text-lg font-semibold mb-3">
      Verträge durchsuchen
    </label>
    <div class="relative">
      <!-- Lupe-Icon (links) -->
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>

      <!-- Eingabefeld -->
      <input
        id="search"
        type="text"
        bind:value={searchQuery}
        placeholder="Suche nach Name, Anbieter oder Status..."
        class="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />

      <!-- Clear-Button (rechts, nur sichtbar wenn Text vorhanden) -->
      {#if searchQuery.trim() !== ""}
        <button
          onclick={() => (searchQuery = "")}
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Suche löschen"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Suchergebnis-Anzeige -->
    {#if searchQuery.trim() !== ""}
      <p class="text-sm text-gray-600 mt-2">
        📊 {filteredContracts.length} von {contracts.length} Verträgen gefunden
        {#if filteredContracts.length === 0}
          <span class="text-red-600 font-medium">
            – Keine Treffer für "{searchQuery}"
          </span>
        {/if}
      </p>
    {/if}
  </div>

  <!-- Kategorie-Filter -->
  <div class="mb-6">
    <h2 class="text-lg font-semibold mb-3">Nach Kategorie filtern</h2>
    <div class="flex flex-wrap gap-2">
      <!-- "Alle"-Button -->
      <button
        onclick={() => (selectedCategory = "all")}
        class="filter-button {selectedCategory === 'all'
          ? 'filter-button-active'
          : 'filter-button-inactive'}"
      >
        <span class="text-lg">📋</span>
        <span class="font-medium">Alle</span>
        <span class="filter-badge">{contracts.length}</span>
      </button>

      <!-- Kategorie-Buttons -->
      {#each categoryStats as cat}
        {#if cat.count > 0}
          <button
            onclick={() => (selectedCategory = cat.value)}
            class="filter-button {selectedCategory === cat.value
              ? 'filter-button-active'
              : 'filter-button-inactive'}"
          >
            <span class="text-lg">{cat.icon}</span>
            <span class="font-medium">{cat.label}</span>
            <span class="filter-badge">{cat.count}</span>
            {#if parseFloat(cat.monthlyCost) > 0}
              <span class="text-xs text-gray-500">
                {cat.monthlyCost} CHF/M
              </span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  </div>

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

  <!-- Überfällige Kündigungen Sektion -->
  {#if overdueContracts.length > 0}
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-semibold text-red-700">
          🚨 Kündigungsfrist verpasst!
        </h2>
        <span
          class="bg-red-600 text-white px-2 py-1 rounded-full text-sm font-bold animate-pulse"
        >
          {overdueContracts.length}
        </span>
      </div>

      <div class="grid gap-4">
        {#each overdueContracts as contract}
          {@render alertCard(contract, true)}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Dringende Verträge Sektion -->
  {#if urgentContracts.length > 0}
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-semibold text-red-600">
          ⚠️ Dringende Kündigungen
        </h2>
        <span
          class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium"
        >
          {urgentContracts.length}
        </span>
      </div>

      <div class="grid gap-4">
        {#each urgentContracts as contract}
          {@render alertCard(contract, false)}
        {/each}
      </div>
    </div>
  {/if}

  <h2 class="text-xl font-semibold mb-4">
    {#if searchQuery.trim() !== "" || selectedCategory !== "all"}
      Gefilterte Verträge ({sortedContracts.length})
    {:else}
      Alle Verträge ({contracts.length})
    {/if}
  </h2>

  {#if contracts.length === 0}
    <div class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">Noch keine Verträge vorhanden.</p>
      <a
        href="/dashboard/contracts/new"
        class="text-blue-600 hover:text-blue-800 font-medium"
      >
        Ersten Vertrag erstellen
      </a>
    </div>
  {:else}
    <div class="grid gap-6">
      {#each sortedContracts as contract}
        <!-- Card mit onclick-Handler statt <a>-Tag -->
        <div
          onclick={() => navigateToDetails(contract._id)}
          class="contract-card {contract.status === 'active'
            ? 'contract-card-active'
            : 'contract-card-inactive'} rounded-lg shadow-md border border-gray-200 p-4 cursor-pointer"
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && navigateToDetails(contract._id)}
        >
          <div>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold">{contract.name}</h3>

                  <!-- Kategorie-Badge -->
                  {#if contract.category}
                    {@const cat = getCategoryByValue(contract.category)}
                    {#if cat}
                      <span class="category-badge category-badge-{cat.color}">
                        {cat.icon}
                        {cat.label}
                      </span>
                    {/if}
                  {/if}
                </div>

                <p class="text-gray-600">Anbieter: {contract.provider}</p>

                {#if contract.cancellationUrl}
                  <span
                    class="inline-flex items-center gap-1 text-sm text-blue-600 mt-1"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path>
                    </svg>
                    Kündigungslink verfügbar
                  </span>
                {/if}

                <div class="mt-2">
                  <p class="text-base font-medium text-gray-700">
                    🗓️ Kündigung möglich bis:
                    <span class="font-semibold"
                      >{new Date(contract.cancellationDate).toLocaleDateString(
                        "de-DE",
                      )}</span
                    >
                  </p>
                  {#if !contract.isUrgent && contract.status === "active"}
                    <p class="text-sm text-gray-600 mt-1">
                      🔔 Erinnerung {contract.reminderDays} Tage vorher
                      <span class="font-medium"
                        >({new Date(contract.reminderDate).toLocaleDateString(
                          "de-DE",
                        )})</span
                      >
                    </p>
                  {/if}
                </div>

                {#if contract.cost && contract.cost > 0}
                  <p class="text-sm font-medium text-blue-600 mt-2">
                    {contract.cost.toFixed(2)} CHF / {formatBillingCycle(
                      contract.billingCycle,
                    )}
                  </p>
                {:else}
                  <p class="text-sm text-gray-400 mt-2 italic">
                    Keine Kosten angegeben
                  </p>
                {/if}
              </div>

              <span
                class="{contract.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm h-fit"
              >
                {contract.status === "active" ? "Aktiv" : "Gekündigt"}
              </span>
            </div>

            <!-- Buttons mit Event-Propagation stoppen -->
            <div class="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <a
                href="/dashboard/contracts/{contract._id}"
                onclick={(e) => e.stopPropagation()}
                class="text-gray-600 hover:text-gray-800 hover:underline text-sm font-medium transition-colors"
              >
                👁️ Details
              </a>
              <a
                href="/dashboard/contracts/{contract._id}/edit"
                onclick={(e) => e.stopPropagation()}
                class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
              >
                ✏️ Bearbeiten
              </a>
              <a
                href="/dashboard/contracts/{contract._id}/delete"
                onclick={(e) => e.stopPropagation()}
                class="text-red-600 hover:text-red-800 hover:underline text-sm font-medium transition-colors"
              >
                🗑️ Löschen
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Puls-Animation für überfällige Badges */
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .contract-card {
    transition: all 0.2s ease;
  }

  .contract-card:hover {
    box-shadow:
      0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
    border-color: rgb(59, 130, 246);
    border-width: 2px;
    transform: translateY(-5px);
  }

  .contract-card-active {
    background: linear-gradient(135deg, #dbeafe 0%, #ffffff 70%);
  }

  .contract-card-inactive {
    background: linear-gradient(135deg, #f3f4f6 0%, #ffffff 70%);
  }

/* === Kategorie-Filter === */
.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  background: white;
  font-size: 0.875rem;
}

.filter-button-inactive {
  border-color: #e5e7eb;
  color: #6b7280;
}

.filter-button-inactive:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
}

.filter-button-active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  color: #1e40af;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.filter-badge {
  background: #3b82f6;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* === Kategorie-Badges in Cards === */
.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
}

.category-badge-purple {
  background: #f3e8ff;
  color: #7c3aed;
  border-color: #c4b5fd;
}

.category-badge-green {
  background: #d1fae5;
  color: #059669;
  border-color: #a7f3d0;
}

.category-badge-blue {
  background: #dbeafe;
  color: #2563eb;
  border-color: #bfdbfe;
}

.category-badge-yellow {
  background: #fef3c7;
  color: #d97706;
  border-color: #fde68a;
}

.category-badge-red {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.category-badge-gray {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}
</style>