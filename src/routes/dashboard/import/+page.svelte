<script>
  import { enhance } from '$app/forms';
  import { CATEGORIES, getCategoryByValue } from '$lib/constants';
  import Icon from '$lib/components/Icon.svelte';

  /** @type {{ form: import('./$types').ActionData }} */
  let { form } = $props();

  let uploading = $state(false);
  let showPreview = $derived(form?.preview === true);
  // Übersprungene Zeilen liefert nur die Vorschau (`errors`); im Fehlerzweig heissen sie `validationErrors`
  let skipped = $derived(form?.errors ?? []);

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

<svelte:head>
  <title>CSV-Import – SubSense</title>
</svelte:head>

{#snippet spinner()}
  <svg class="animate-spin" width="15" height="15" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
{/snippet}

<div class="mx-auto max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
  <!-- Breadcrumb-Navigation -->
  <nav class="text-[13px]" aria-label="Brotkrumen">
    <ol class="flex items-center gap-2 text-ink-2">
      <li>
        <a href="/dashboard" class="hover:text-ink">Dashboard</a>
      </li>
      <li aria-hidden="true">/</li>
      <li class="text-ink">CSV-Import</li>
    </ol>
  </nav>

  <h1 class="mt-4 mb-2 text-3xl font-semibold tracking-tight">CSV-Import</h1>
  <p class="mb-8 max-w-2xl text-ink-2">
    Importiere mehrere Verträge auf einmal aus einer CSV-Datei. Ideal für
    Migration oder Bulk-Erfassung.
  </p>

  <!-- Fehler-Banner -->
  {#if form?.error && !showPreview}
    <div role="alert" class="mb-6 flex max-w-2xl items-start gap-3 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
      <Icon name="alert" class="mt-0.5 shrink-0" />
      <div>
        <p class="font-semibold">{form.error}</p>
        {#if form.validationErrors && form.validationErrors.length > 0}
          <ul class="mt-2 list-inside list-disc space-y-1">
            {#each form.validationErrors as err}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
        {#if form.warnings && form.warnings.length > 0}
          <div class="mt-3 border-t border-crit/20 pt-3">
            <p class="font-semibold">Warnungen:</p>
            <ul class="mt-1 list-inside list-disc space-y-1">
              {#each form.warnings as warn}
                <li>{warn}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Upload-Formular (wenn keine Preview) -->
  {#if !showPreview}
    <div class="max-w-2xl">
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
        <div class="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center transition-colors hover:border-ink-3">
          <Icon name="upload" size={28} class="mx-auto mb-4 text-ink-3" />

          <input
            type="file"
            name="csvFile"
            accept=".csv"
            required
            aria-label="CSV-Datei auswählen"
            class="block w-full cursor-pointer text-sm text-ink-2 file:mr-4 file:cursor-pointer file:rounded-card file:border file:border-solid file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-[13.5px] file:font-medium file:text-ink hover:file:border-ink-3"
          />

          <p class="hint mt-4">
            Maximal 4 MB · Nur .csv-Dateien · UTF-8-Kodierung
          </p>
        </div>

        <button type="submit" disabled={uploading} class="btn btn-primary mt-4">
          {#if uploading}
            {@render spinner()}
            Datei wird verarbeitet …
          {:else}
            Vorschau anzeigen
          {/if}
        </button>
      </form>
    </div>

    <!-- Template-Download & Hilfe -->
    <div class="mt-10 grid gap-x-10 gap-y-8 border-t border-line-strong pt-8 md:grid-cols-2">
      <!-- Template-Download -->
      <section>
        <h2 class="mb-2 font-semibold">Vorlage herunterladen</h2>
        <p class="mb-4 text-sm text-ink-2">
          Lade eine Beispiel-CSV herunter, um das korrekte Format zu sehen.
        </p>
        <a href="/api/template" download class="btn">
          <Icon name="download" size={15} />
          Template.csv herunterladen
        </a>
      </section>

      <!-- CSV-Format-Hilfe -->
      <section>
        <h2 class="mb-2 font-semibold">CSV-Format-Anforderungen</h2>
        <ul class="space-y-2 text-sm text-ink-2">
          <li>
            <strong class="font-medium text-ink">Pflichtfelder:</strong> name, provider, cancellationDate, status
          </li>
          <li>
            <strong class="font-medium text-ink">Datum-Format:</strong> YYYY-MM-DD (z.B. 2026-03-15)
          </li>
          <li>
            <strong class="font-medium text-ink">Status:</strong> "active" oder "cancelled"
          </li>
          <li>
            <strong class="font-medium text-ink">Kosten:</strong> Dezimalzahl mit Punkt (z.B. 15.90)
          </li>
          <li>
            <strong class="font-medium text-ink">Kodierung:</strong> UTF-8 (Umlaute werden unterstützt)
          </li>
        </ul>
      </section>
    </div>
  {:else}
    <!-- Preview-Ansicht -->
    <div role="status" class="mb-6 flex items-start gap-3 rounded-card border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">
      <Icon name="check" class="mt-0.5 shrink-0" />
      <div>
        <p class="font-semibold">{skipped.length > 0 ? 'CSV-Datei gelesen' : 'CSV-Datei erfolgreich gelesen'}</p>
        <p class="mt-1">
          {form.totalContracts} {form?.totalContracts === 1 ? 'Vertrag' : 'Verträge'} gefunden. Überprüfe die Daten vor dem
          Import.
        </p>
      </div>
    </div>

    <!-- Übersprungene Zeilen (Import trotzdem möglich) -->
    {#if skipped.length > 0}
      <div role="alert" class="mb-6 rounded-card border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
        <p class="mb-2 flex items-center gap-2 font-semibold">
          <Icon name="alert" />
          {skipped.length} {skipped.length === 1 ? 'Zeile' : 'Zeilen'} übersprungen
        </p>
        <ul class="list-inside list-disc space-y-1">
          {#each skipped as err}
            <li>{err}</li>
          {/each}
        </ul>
        <p class="mt-2 text-xs">
          Übersprungene Zeilen werden nicht importiert. Korrigiere die Datei und
          lade sie erneut hoch, um sie zu übernehmen.
        </p>
      </div>
    {/if}

    <!-- Warnungen anzeigen (falls vorhanden) -->
    {#if form.warnings && form.warnings.length > 0}
      <div class="mb-6 rounded-card border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
        <p class="mb-2 flex items-center gap-2 font-semibold">
          <Icon name="alert" />
          Warnungen
        </p>
        <ul class="list-inside list-disc space-y-1">
          {#each form.warnings as warn}
            <li>{warn}</li>
          {/each}
        </ul>
        <p class="mt-2 text-xs">
          Diese Werte wurden automatisch korrigiert. Der Import kann trotzdem
          fortgesetzt werden.
        </p>
      </div>
    {/if}

    <!-- Preview-Tabelle -->
    <div class="mb-6">
      <h2 class="mb-3 text-xs font-medium uppercase tracking-[0.09em] text-ink-3">Import-Vorschau</h2>
      <div class="overflow-x-auto border-t border-line-strong">
        <table class="w-full text-sm">
          <thead class="border-b border-line-strong text-left text-xs text-ink-3">
            <tr>
              <th class="px-3 py-2.5 font-medium">#</th>
              <th class="px-3 py-2.5 font-medium">Name</th>
              <th class="px-3 py-2.5 font-medium">Anbieter</th>
              <th class="px-3 py-2.5 font-medium">Kündigungsfrist</th>
              <th class="px-3 py-2.5 font-medium">Status</th>
              <th class="px-3 py-2.5 text-right font-medium">Kosten</th>
              <th class="px-3 py-2.5 font-medium">Kategorie</th>
            </tr>
          </thead>
          <tbody>
            {#each form.contracts as contract, index}
              {@const cat = getCategoryByValue(contract.category)}
              <tr class="border-b border-line">
                <td class="px-3 py-3 font-mono text-ink-3">{index + 1}</td>
                <td class="px-3 py-3 font-medium">{contract.name}</td>
                <td class="px-3 py-3 text-ink-2">{contract.provider}</td>
                <td class="px-3 py-3 font-mono">
                  {new Date(contract.cancellationDate).toLocaleDateString('de-CH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td class="px-3 py-3">
                  <span class="cat">
                    {contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}
                  </span>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  {#if contract.cost > 0}
                    <span class="font-mono">{contract.cost.toFixed(2)}</span>
                    <span class="text-xs text-ink-3">CHF / {formatBillingCycle(contract.billingCycle)}</span>
                  {:else}
                    <span class="text-xs text-ink-3">Keine Angabe</span>
                  {/if}
                </td>
                <td class="px-3 py-3">
                  {#if cat}
                    <span class="cat">{cat.label}</span>
                  {:else}
                    <span class="text-xs text-ink-3">Unbekannt</span>
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

      <div class="flex flex-wrap gap-2">
        <button type="submit" disabled={uploading} class="btn btn-primary">
          {#if uploading}
            {@render spinner()}
            Verträge werden importiert …
          {:else}
            <Icon name="check" size={15} />
            {form.totalContracts} {form?.totalContracts === 1 ? 'Vertrag' : 'Verträge'} importieren
          {/if}
        </button>

        <a href="/dashboard/import" class="btn">
          Abbrechen
        </a>
      </div>

      <p class="hint mt-3">
        Hinweis: Bereits existierende Verträge mit identischem Namen werden
        nicht erkannt. Es können Duplikate entstehen.
      </p>
    </form>
  {/if}
</div>
