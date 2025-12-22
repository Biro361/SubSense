<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  let { data } = $props();
  let contracts = $derived(data.contracts || []);

  let message = $derived($page.url.searchParams.get("message"));

  let successMessage = $derived(
    message === "created"
      ? "Vertrag erfolgreich erstellt!"
      : message === "updated"
        ? "Vertrag erfolgreich aktualisiert!"
        : message === "deleted"
          ? "Vertrag erfolgreich gelöscht!"
          : null,
  );

  // Toast-State
  let showToast = $state(false);
  let toastMessage = $state("");

  // Toast anzeigen und nach 5 Sekunden auto-dismiss
  onMount(() => {
    if (successMessage) {
      toastMessage = successMessage;
      showToast = true;

      // Auto-dismiss nach 5 Sekunden
      setTimeout(() => {
        showToast = false;
      }, 5000);

      // URL bereinigen (ohne ?message=...)
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url);
    }
  });

  // Manuelles Schließen
  function closeToast() {
    showToast = false;
  }

  // Verträge nach Dringlichkeit sortieren (dringend zuerst)
  let sortedContracts = $derived(
    [...contracts].sort((a, b) => {
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
    activeContracts.reduce((sum, contract) => {
      const cost = contract.cost || 0;
      const cycle = contract.billingCycle || "monthly";

      // Auf monatliche Kosten normalisieren
      let monthlyCost = cost;
      if (cycle === "yearly") monthlyCost = cost / 12;
      if (cycle === "quarterly") monthlyCost = cost / 3;

      return sum + monthlyCost;
    }, 0),
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
</script>

<!-- Toast-Notification (Top-Right, Fixed) -->
{#if showToast}
  <div
    class="fixed top-4 right-4 z-50 animate-slide-in-right"
    role="alert"
    aria-live="polite"
  >
    <div
      class="bg-white rounded-lg shadow-2xl border-2 border-green-500 overflow-hidden max-w-md"
    >
      <!-- Header mit Icon und Close-Button -->
      <div class="flex items-start gap-3 p-4">
        <!-- Checkmark-Icon -->
        <div
          class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        <!-- Message -->
        <div class="flex-1 pt-0.5">
          <p class="text-base font-semibold text-gray-900">Erfolgreich!</p>
          <p class="text-sm text-gray-600 mt-1">{toastMessage}</p>
        </div>

        <!-- Close-Button -->
        <button
          onclick={closeToast}
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Schließen"
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
      </div>

      <!-- Progress-Bar (5 Sekunden Animation) -->
      <div class="h-1 bg-gray-100">
        <div class="h-full bg-green-500 animate-progress-bar"></div>
      </div>
    </div>
  </div>
{/if}

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

  <!-- NEU: Überfällige Kündigungen Sektion (Höchste Priorität) -->
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
          <div
            class="bg-red-100 border-2 border-red-500 rounded-lg shadow-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {contract.name}
                  </h3>
                  <span
                    class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    ÜBERFÄLLIG
                  </span>
                </div>
                <p class="text-gray-800 font-medium">
                  Anbieter: {contract.provider}
                </p>

                <!-- Überfällig-Anzeige -->
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

                {#if contract.cost && contract.cost > 0}
                  <p class="text-sm font-medium text-blue-600 mt-3">
                    {contract.cost.toFixed(2)} CHF / {formatBillingCycle(
                      contract.billingCycle,
                    )}
                  </p>
                {/if}
              </div>

              <span
                class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm h-fit"
              >
                {contract.status === "active" ? "Aktiv" : "Gekündigt"}
              </span>
            </div>

            <div class="flex gap-2 mt-4 pt-4 border-t border-red-300">
              <a
                href="/contracts/{contract._id}/edit"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
              >
                Status aktualisieren
              </a>
              <a
                href="/contracts/{contract._id}/delete"
                class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium"
              >
                Löschen
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- NEU: Dringende Verträge Sektion -->
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
          <div class="bg-red-50 border-2 border-red-200 rounded-lg shadow p-4">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold">{contract.name}</h3>
                  <span
                    class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    DRINGEND
                  </span>
                </div>
                <p class="text-gray-700 font-medium">
                  Anbieter: {contract.provider}
                </p>

                <!-- Countdown-Anzeige - VERBESSERT -->
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

                {#if contract.cost && contract.cost > 0}
                  <p class="text-sm font-medium text-blue-600 mt-3">
                    {contract.cost.toFixed(2)} CHF / {formatBillingCycle(
                      contract.billingCycle,
                    )}
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

            <div class="flex gap-2 mt-4 pt-4 border-t border-red-200">
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
    <!-- NEU -->
    <div class="grid gap-6">
      {#each sortedContracts as contract}
        <div class="bg-white rounded-lg shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 p-4 transition-all duration-200 hover:-translate-y-1">
          <div class="{contract.isUrgent || contract.isOverdue ? 'opacity-50' : ''}">          
            <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{contract.name}</h3>
              <p class="text-gray-600">Anbieter: {contract.provider}</p>

              <!-- Erinnerungs-Info - VERBESSERT -->
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

              <!-- Kostenanzeige -->
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

          <div class="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <a
              href="/contracts/{contract._id}/edit"
              class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
            >
              ✏️ Bearbeiten
            </a>
            <a
              href="/contracts/{contract._id}/delete"
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
  /* Slide-In-Animation von rechts */
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  /* Progress-Bar Animation (5 Sekunden) */
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-progress-bar {
    animation: progress 5s linear;
  }

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
</style>
