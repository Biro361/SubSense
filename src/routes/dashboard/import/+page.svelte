<script>
  import { enhance } from '$app/forms';
  import { CATEGORIES, getCategoryByValue } from '$lib/constants';

  /** @type {{ form: import('./$types').ActionData }} */
  let { form } = $props();

  let uploading = $state(false);
  let showPreview = $derived(form?.preview === true);
  let showPartialSuccess = $derived(form?.partialSuccess === true);

  // Abrechnungszyklus formatieren
  function formatBillingCycle(cycle) {
    switch (cycle) {
      case 'monthly':
        return 'Monat';
      case 'yearly':
        return 'Jahr';
      case 'quarterly':
        return 'Quartal';
      default:
        return 'Monat';
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <!-- Breadcrumb-Navigation -->
  <nav class="mb-6 text-sm">
    <ol class="flex items-center gap-2 text-gray-600">
      <li>
        <a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
      </li>
      <li>&gt;</li>
      <li class="font-semibold text-gray-900">CSV-Import</li>
    </ol>
  </nav>

  <h1 class="text-3xl font-bold mb-2">📥 CSV-Import</h1>
  <p class="text-gray-600 mb-6">
    Importiere mehrere Verträge auf einmal aus einer CSV-Datei. Ideal für
    Migration oder Bulk-Erfassung.
  </p>

  <!-- Fehler-Banner -->
  {#if form?.error && !showPreview && !showPartialSuccess}
    <div
      class="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-lg mb-6"
    >
      <div class="flex items-start gap-3">
        <svg
          class="w-6 h-6 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <p class="font-semibold">{form.error}</p>
          {#if form.validationErrors && form.validationErrors.length > 0}
            <ul class="mt-2 list-disc list-inside space-y-1 text-sm">
              {#each form.validationErrors as err}
                <li>{err}</li>
              {/each}
            </ul>
          {/if}
          {#if form.warnings && form.warnings.length > 0}
            <div class="mt-3 pt-3 border-t border-red-300">
              <p class="font-semibold text-sm">⚠️ Warnungen:</p>
              <ul class="mt-1 list-disc list-inside space-y-1 text-sm">
                {#each form.warnings as warn}
                  <li>{warn}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Teilerfolg-Banner -->
  {#if showPartialSuccess}
    <div
      class="bg-yellow-100 border-2 border-yellow-500 text-yellow-900 p-4 rounded-lg mb-6"
    >
      <div class="flex items-start gap-3">
        <svg
          class="w-6 h-6 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          ></path>
        </svg>
        <div>
          <p class="font-semibold">
            ✅ {form.successCount} Verträge erfolgreich importiert
          </p>
          <p class="mt-1">
            ⚠️ {form.failCount} Fehler beim Import:
          </p>
          <ul class="mt-2 list-disc list-inside space-y-1 text-sm">
            {#each form.importErrors as err}
              <li>{err}</li>
            {/each}
          </ul>
          <a
            href="/dashboard"
            class="inline-block mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Zum Dashboard
          </a>
        </div>
      </div>
    </div>
  {/if}

  <!-- Upload-Formular (wenn keine Preview) -->
  {#if !showPreview}
    <form
      method="POST"
      action="?/preview"
      enctype="multipart/form-data"
      use:enhance={() => {
        uploading = true;
        return async ({ update }) => {
          uploading = false;
          await update();
        };
      }}
    >
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-all"
      >
        <svg
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          ></path>
        </svg>

        <input
          type="file"
          name="csvFile"
          accept=".csv"
          required
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 cursor-pointer"
        />

        <p class="mt-4 text-sm text-gray-600">
          Maximal 5 MB | Nur .csv-Dateien | UTF-8 Kodierung
        </p>
      </div>

      <button
        type="submit"
        disabled={uploading}
        class="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
      >
        {#if uploading}
          <svg
            class="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Datei wird verarbeitet...
        {:else}
          📋 Vorschau anzeigen
        {/if}
      </button>
    </form>

    <!-- Template-Download & Hilfe -->
    <div class="mt-8 grid md:grid-cols-2 gap-6">
      <!-- Template-Download -->
      <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-2 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            ></path>
          </svg>
          Vorlage herunterladen
        </h3>
        <p class="text-sm text-gray-700 mb-4">
          Lade eine Beispiel-CSV herunter, um das korrekte Format zu sehen.
        </p>
        <a
          href="/api/template"
          download
          class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Template.csv herunterladen
        </a>
      </div>

      <!-- CSV-Format-Hilfe -->
      <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <h3 class="font-semibold text-lg mb-2 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          CSV-Format-Anforderungen
        </h3>
        <ul class="text-sm text-gray-700 space-y-2">
          <li>
            <strong>Pflichtfelder:</strong> name, provider, cancellationDate, status
          </li>
          <li>
            <strong>Datum-Format:</strong> YYYY-MM-DD (z.B. 2026-03-15)
          </li>
          <li>
            <strong>Status:</strong> "active" oder "cancelled"
          </li>
          <li>
            <strong>Kosten:</strong> Dezimalzahl mit Punkt (z.B. 15.90)
          </li>
          <li>
            <strong>Kodierung:</strong> UTF-8 (Umlaute werden unterstützt)
          </li>
        </ul>
      </div>
    </div>
  {:else}
    <!-- Preview-Ansicht -->
    <div class="bg-green-50 border-2 border-green-500 p-4 rounded-lg mb-6">
      <div class="flex items-start gap-3">
        <svg
          class="w-6 h-6 flex-shrink-0 mt-0.5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <p class="font-semibold text-green-900">
            ✅ CSV-Datei erfolgreich gelesen!
          </p>
          <p class="text-sm text-green-800 mt-1">
            {form.totalContracts} Verträge gefunden. Überprüfe die Daten vor dem
            Import.
          </p>
        </div>
      </div>
    </div>

    <!-- Warnungen anzeigen (falls vorhanden) -->
    {#if form.warnings && form.warnings.length > 0}
      <div class="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg mb-6">
        <p class="font-semibold text-yellow-900 mb-2">⚠️ Warnungen:</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-yellow-800">
          {#each form.warnings as warn}
            <li>{warn}</li>
          {/each}
        </ul>
        <p class="text-xs text-yellow-700 mt-2 italic">
          Diese Werte wurden automatisch korrigiert. Der Import kann trotzdem
          fortgesetzt werden.
        </p>
      </div>
    {/if}

    <!-- Preview-Tabelle -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">📋 Import-Vorschau</h2>
      <div class="overflow-x-auto border-2 border-gray-200 rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left font-semibold">#</th>
              <th class="px-4 py-3 text-left font-semibold">Name</th>
              <th class="px-4 py-3 text-left font-semibold">Anbieter</th>
              <th class="px-4 py-3 text-left font-semibold">Kündigungsfrist</th>
              <th class="px-4 py-3 text-left font-semibold">Status</th>
              <th class="px-4 py-3 text-left font-semibold">Kosten</th>
              <th class="px-4 py-3 text-left font-semibold">Kategorie</th>
            </tr>
          </thead>
          <tbody>
            {#each form.contracts as contract, index}
              {@const cat = getCategoryByValue(contract.category)}
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="px-4 py-3 text-gray-600">{index + 1}</td>
                <td class="px-4 py-3 font-medium">{contract.name}</td>
                <td class="px-4 py-3">{contract.provider}</td>
                <td class="px-4 py-3">
                  {new Date(contract.cancellationDate).toLocaleDateString(
                    'de-DE'
                  )}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="{contract.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  {#if contract.cost > 0}
                    {contract.cost.toFixed(2)} CHF / {formatBillingCycle(
                      contract.billingCycle
                    )}
                  {:else}
                    <span class="text-gray-400 text-xs">Keine Angabe</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  {#if cat}
                    <span class="text-xs">{cat.icon} {cat.label}</span>
                  {:else}
                    <span class="text-gray-400 text-xs">Unbekannt</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bestätigungs-Formular -->
    <form
      method="POST"
      action="?/import"
      use:enhance={() => {
        uploading = true;
        return async ({ update }) => {
          uploading = false;
          await update();
        };
      }}
    >
      <input type="hidden" name="csvContent" value={form.csvContent} />

      <div class="flex gap-4">
        <button
          type="submit"
          disabled={uploading}
          class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          {#if uploading}
            <svg
              class="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Verträge werden importiert...
          {:else}
            ✅ {form.totalContracts} Verträge importieren
          {/if}
        </button>

        <a
          href="/dashboard/import"
          class="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
        >
          Abbrechen
        </a>
      </div>

      <p class="text-xs text-gray-600 mt-3 text-center">
        ⚠️ Hinweis: Bereits existierende Verträge mit identischem Namen werden
        nicht erkannt. Es können Duplikate entstehen.
      </p>
    </form>
  {/if}
</div>

<style>
  /* Spinner-Animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>