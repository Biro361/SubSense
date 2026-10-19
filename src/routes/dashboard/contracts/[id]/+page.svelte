<!-- src/routes/dashboard/contracts/[id]/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { getCategoryByValue } from '$lib/constants';
  import Icon from '$lib/components/Icon.svelte';

  let { data, form } = $props();
  let contract = $derived(data.contract);

  // Tab-State
  let activeTab = $state('details');

  // Edit-States
  let notesText = $state(contract.notes || '');
  let instructionsText = $state(contract.cancellationInstructions || '');
  let cancellationUrl = $state(contract.cancellationUrl || '');

  // Ohne reset: false leert enhance die Felder, die States behalten aber nur den Anfangswert
  /** @type {import('@sveltejs/kit').SubmitFunction} */
  const keepValues = () => async ({ update }) => update({ reset: false });

  // Kategorie-Info
  const category = $derived(getCategoryByValue(contract.category));

  // Datum formatieren
  function formatDate(dateString) {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Dateigrösse formatieren
  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Lösch-Bestätigung für Dokumente
  function confirmDelete(e) {
    if (!confirm('Dokument wirklich löschen?')) {
      e.preventDefault();
    }
  }

  const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'notes', label: 'Notizen' },
    { id: 'instructions', label: 'Kündigungsanweisungen' },
    { id: 'documents', label: 'Dokumente' }
  ];
</script>

<svelte:head>
  <title>{contract.name} – SubSense</title>
</svelte:head>

<div class="max-w-[70rem] mx-auto px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
  <!-- Header -->
  <div class="mb-8">
    <a href="/dashboard" class="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
      ← Zurück zum Dashboard
    </a>

    <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-semibold tracking-tight [overflow-wrap:anywhere]">{contract.name}</h1>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>{contract.provider}</span>
          {#if category}<span class="cat">{category.label}</span>{/if}
          <span class="cat">{contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}</span>
        </div>
      </div>

      <a href="/dashboard/contracts/{contract._id}/edit" class="btn btn-primary">
        <Icon name="pencil" size={15} />
        Bearbeiten
      </a>
    </div>
  </div>

  <!-- Feedback-Meldung -->
  {#if form?.success}
    <div class="mb-6 flex items-center gap-2 rounded-card border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">
      <Icon name="check" />
      {form.message}
    </div>
  {:else if form?.success === false}
    <div class="mb-6 flex items-center gap-2 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
      <Icon name="alert" />
      {form.message}
    </div>
  {/if}

  <!-- Tabs -->
  <div class="mb-6 border-b border-line-strong">
    <nav class="-mb-px flex gap-5 overflow-x-auto">
      {#each TABS as tab}
        <button
          onclick={() => activeTab = tab.id}
          class="whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors {activeTab === tab.id ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink'}"
        >
          {tab.label}
          {#if tab.id === 'documents'}
            <span class="font-mono text-xs text-ink-3">{contract.documents?.length || 0}</span>
          {/if}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Tab-Content -->
  <div class="max-w-2xl">

    <!-- Details Tab -->
    {#if activeTab === 'details'}
      <dl class="grid grid-cols-2 gap-x-6 gap-y-6 max-sm:grid-cols-1">
        <div>
          <dt class="label">Kündigungsdatum</dt>
          <dd class="font-mono text-lg font-semibold">{formatDate(contract.cancellationDate)}</dd>
        </div>

        <div>
          <dt class="label">Tage bis zur Kündigung</dt>
          <dd class="font-mono text-lg font-semibold {contract.isOverdue ? 'text-crit' : contract.isUrgent ? 'text-warn' : ''}">
            {#if contract.isOverdue}
              Überfällig ({Math.abs(contract.daysUntilCancellation)} Tage)
            {:else if contract.daysUntilCancellation === 0}
              Heute
            {:else if contract.daysUntilCancellation === 1}
              Morgen
            {:else}
              Noch {contract.daysUntilCancellation} Tage
            {/if}
          </dd>
        </div>

        <div>
          <dt class="label">Kosten</dt>
          <dd class="font-mono text-lg font-semibold">
            {contract.cost?.toFixed(2) || '0.00'}
            <span class="font-sans text-sm font-normal text-ink-3">CHF / {contract.billingCycle === 'monthly' ? 'Monat' : contract.billingCycle === 'yearly' ? 'Jahr' : 'Quartal'}</span>
          </dd>
        </div>

        <div>
          <dt class="label">Erinnerung</dt>
          <dd>{contract.reminderDays} Tage vorher ({formatDate(contract.reminderDate)})</dd>
        </div>

        {#if contract.cancellationUrl}
          <div class="col-span-full">
            <dt class="label">Kündigungsseite</dt>
            <dd>
              <a
                href={contract.cancellationUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-accent [overflow-wrap:anywhere] hover:underline"
              >
                <Icon name="external" class="shrink-0" />
                {contract.cancellationUrl}
              </a>
            </dd>
          </div>
        {/if}

        <div class="border-t border-line pt-6">
          <dt class="label">Erstellt am</dt>
          <dd class="text-ink-2">{formatDate(contract.createdAt)}</dd>
        </div>
        <div class="border-t border-line pt-6 max-sm:border-0 max-sm:pt-0">
          <dt class="label">Zuletzt aktualisiert</dt>
          <dd class="text-ink-2">{formatDate(contract.updatedAt)}</dd>
        </div>
      </dl>
    {/if}

    <!-- Notizen Tab -->
    {#if activeTab === 'notes'}
      <form method="POST" action="?/updateNote" use:enhance={keepValues}>
        <div>
          <label for="notes" class="label">
            Persönliche Notizen
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="10"
            bind:value={notesText}
            class="field"
            placeholder="Hier kannst du Notizen zu diesem Vertrag speichern...\n\nBeispielsweise:\n- Testphase endet am 15. Februar\n- Kündigung per E-Mail an kuendigung@anbieter.ch\n- Kundennummer: 12345"
          ></textarea>
          <p class="hint">
            Notiere wichtige Details wie Kundennummern, Kontaktdaten oder Kündigungshinweise.
          </p>
        </div>

        <button type="submit" class="btn btn-primary mt-4">
          Speichern
        </button>
      </form>
    {/if}

    <!-- Kündigungsanweisungen Tab -->
    {#if activeTab === 'instructions'}
      <form method="POST" action="?/updateInstructions" use:enhance={keepValues}>
        <div class="space-y-5">
          <div>
            <label for="cancellationUrl" class="label">
              Link zur Kündigungsseite
            </label>
            <input
              type="url"
              id="cancellationUrl"
              name="cancellationUrl"
              bind:value={cancellationUrl}
              class="field"
              placeholder="https://www.anbieter.ch/kuendigung"
            />
          </div>

          <div>
            <label for="instructions" class="label">
              Kündigungsanweisungen
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows="10"
              bind:value={instructionsText}
              class="field"
              placeholder="Schritt-für-Schritt Anleitung zur Kündigung...\n\n1. Auf der Webseite einloggen\n2. Menü 'Mein Konto' öffnen\n3. Unter 'Verträge' die Option 'Kündigen' wählen\n4. Kündigungsbestätigung per E-Mail abwarten"
            ></textarea>
            <p class="hint">
              Halte die Schritte fest, damit du beim nächsten Mal schnell weisst, wie die Kündigung funktioniert.
            </p>
          </div>
        </div>

        <button type="submit" class="btn btn-primary mt-4">
          Speichern
        </button>
      </form>
    {/if}

    <!-- Dokumente Tab -->
    {#if activeTab === 'documents'}
      <div class="space-y-8">
        <!-- Upload-Formular -->
        <form method="POST" action="?/uploadDocument" enctype="multipart/form-data" use:enhance>
          <div class="rounded-card border border-dashed border-line-strong bg-surface p-6 text-center transition-colors hover:border-ink-3">
            <input
              type="file"
              name="document"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              class="peer sr-only"
              id="file-upload"
            />
            <label
              for="file-upload"
              class="flex cursor-pointer flex-col items-center gap-2 rounded-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >
              <Icon name="upload" size={24} class="text-ink-3" />
              <span class="text-sm font-medium">Dokument auswählen</span>
              <span class="text-xs text-ink-3">PDF, Word, JPG, PNG, WebP (max. 4 MB)</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary mt-4">
            <Icon name="upload" size={15} />
            Hochladen
          </button>
        </form>

        <!-- Dokumentenliste -->
        {#if contract.documents && contract.documents.length > 0}
          <div>
            <h3 class="mb-2 text-xs font-medium uppercase tracking-[0.09em] text-ink-3">Gespeicherte Dokumente</h3>
            <ul class="border-t border-line-strong">
              {#each contract.documents as doc}
                <li class="flex items-center justify-between gap-3 border-b border-line py-3">
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <Icon name="doc" size={20} class="shrink-0 text-ink-3" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">{doc.originalName}</p>
                      <p class="text-xs text-ink-3">
                        {formatFileSize(doc.size)} · {formatDate(doc.uploadDate)}
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-0.5">
                    <a
                      href={`/dashboard/contracts/${contract._id}/documents/${doc._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="icon-btn"
                      aria-label="{doc.originalName} öffnen"
                    >
                      <Icon name="eye" />
                    </a>
                    <form method="POST" action="?/deleteDocument" use:enhance>
                      <input type="hidden" name="documentId" value={doc._id} />
                      <button
                        type="submit"
                        class="icon-btn icon-btn-danger"
                        aria-label="{doc.originalName} löschen"
                        onclick={confirmDelete}
                      >
                        <Icon name="trash" />
                      </button>
                    </form>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="py-8 text-center">
            <p class="text-ink-2">Noch keine Dokumente hochgeladen</p>
            <p class="mt-1 text-sm text-ink-3">
              Lade Vertragsdokumente, Kündigungsbestätigungen oder andere wichtige Dateien hoch.
            </p>
          </div>
        {/if}
      </div>
    {/if}

  </div>
</div>
