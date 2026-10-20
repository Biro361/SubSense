<script>
  import { enhance } from "$app/forms";
  import { CATEGORIES } from "$lib/constants";

  let { data, form } = $props();
  let contract = $derived(data.contract);

  // Formular-State, einmalig gesetzt: zuerst die Eingabe nach einem Server-Fehler (form), sonst der gespeicherte Vertrag.
  // Nicht aus $derived ableiten, sonst überschreibt jede Invalidierung die Eingabe.
  // Nur der 400-Zweig liefert die Rohwerte mit; 403/500 enthalten bloss `error`.
  const sent = /** @type {Record<string, any>} */ (form ?? {});
  let name = $state(sent.name ?? contract.name);
  let provider = $state(sent.provider ?? contract.provider);
  let cancellationUrl = $state(sent.cancellationUrl ?? (contract.cancellationUrl || ""));
  // Datum für Input-Feld formatieren (YYYY-MM-DD)
  let cancellationDate = $state(
    sent.cancellationDate ??
      (contract.cancellationDate
        ? new Date(contract.cancellationDate).toISOString().split("T")[0]
        : ""),
  );
  let cost = $state(sent.cost ?? (contract.cost || 0));
  let billingCycle = $state(sent.billingCycle ?? (contract.billingCycle || "monthly"));
  let status = $state(sent.status ?? contract.status);

  // Kalendertag in Zürich wie in reminders.js: Server und Browser sind sich einig, kein Sprung um Mitternacht UTC
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" });
  // Nur ein Hinweis: abgelaufene oder gekündigte Verträge nachzutragen ist erlaubt
  let isPast = $derived(!!cancellationDate && cancellationDate < today);

  // Erinnerungstage State
  let reminderDays = $state(Number(sent.reminderDays ?? contract.reminderDays) || 7);

  // Kategorie State
  let category = $state(sent.category ?? (contract.category || "other"));

  // Preset-Button Handler
  function setReminderPreset(days) {
    reminderDays = days;
  }

  // Feldmeldungen hängen an `form`: bei Erfolg ersetzt SvelteKit es, die Meldungen verschwinden
  let fieldErrors = $derived(/** @type {Record<string, string>} */ ((/** @type {any} */ (form))?.fieldErrors ?? {}));

  /** @type {HTMLElement | undefined} */
  let summary = $state();

  // Nach dem Absenden auf die Zusammenfassung, damit ein Screenreader sie sofort vorliest
  $effect(() => {
    if (form?.error) summary?.focus();
  });

  /**
   * IDs für aria-describedby: zuerst die Feldmeldung, dann weitere Beschreibungen
   * @param {string} field
   * @param {...string} extra
   */
  function describedBy(field, ...extra) {
    return [fieldErrors[field] ? `${field}-error` : '', ...extra].filter(Boolean).join(' ') || undefined;
  }
</script>

<svelte:head>
  <title>{contract.name} bearbeiten – SubSense</title>
</svelte:head>

<div class="mx-auto max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
  <div class="max-w-2xl">
    <h1 class="mb-8 text-3xl font-semibold tracking-tight">Vertrag bearbeiten</h1>

    {#if form?.error}
      <!-- Zusammenfassung; die Meldungen selbst stehen am Feld -->
      <div
        bind:this={summary}
        tabindex="-1"
        role="alert"
        class="mb-6 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit"
      >
        {form.error}
      </div>
    {/if}

    {#snippet fieldError(/** @type {string} */ field)}
      {#if fieldErrors[field]}
        <p id="{field}-error" class="field-error">{fieldErrors[field]}</p>
      {/if}
    {/snippet}

    <form method="POST" use:enhance class="space-y-6">
      <div>
        <label for="name" class="label">
          Vertragsname *
        </label>
        <input
          type="text"
          id="name"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={describedBy('name')}
          name="name"
          bind:value={name}
          required
          class="field"
        />
        {@render fieldError('name')}
      </div>

      <div>
        <label for="provider" class="label">
          Anbieter *
        </label>
        <input
          type="text"
          id="provider"
          aria-invalid={!!fieldErrors.provider}
          aria-describedby={describedBy('provider')}
          name="provider"
          bind:value={provider}
          required
          class="field"
        />
        {@render fieldError('provider')}
      </div>

      <!-- Kündigungs-URL -->
      <div>
        <label for="cancellationUrl" class="label">
          Kündigungs-Link (optional)
        </label>
        <input
          type="url"
          id="cancellationUrl"
          aria-invalid={!!fieldErrors.cancellationUrl}
          aria-describedby={describedBy('cancellationUrl', 'cancellationUrl-hint')}
          name="cancellationUrl"
          bind:value={cancellationUrl}
          placeholder="https://www.netflix.com/cancelplan"
          pattern="https?://.+"
          class="field"
        />
        {@render fieldError('cancellationUrl')}
        <p id="cancellationUrl-hint" class="hint">
          Direkter Link zur Kündigungsseite – spart Zeit beim Kündigen.
        </p>
      </div>

      <div>
        <label for="category" class="label">
          Kategorie *
        </label>
        <select
          id="category"
          aria-invalid={!!fieldErrors.category}
          aria-describedby={describedBy('category')}
          name="category"
          bind:value={category}
          required
          class="field"
        >
          {#each CATEGORIES as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
        {@render fieldError('category')}
      </div>

      <div>
        <label for="cancellationDate" class="label">
          Kündigungsfrist *
        </label>
        <input
          type="date"
          id="cancellationDate"
          aria-invalid={!!fieldErrors.cancellationDate}
          aria-describedby={describedBy('cancellationDate', 'cancellationDate-past')}
          name="cancellationDate"
          bind:value={cancellationDate}
          required
          class="field"
        />
        {@render fieldError('cancellationDate')}
        <!-- Immer im DOM, damit aria-live den Wechsel ansagt -->
        <p id="cancellationDate-past" class="hint text-warn empty:mt-0" aria-live="polite">
          {#if isPast}Diese Frist liegt in der Vergangenheit. Prüfe das Jahr.{/if}
        </p>
      </div>

      <!-- Erinnerung -->
      <div class="rounded-card border border-line bg-surface p-4">
        <label for="reminderDays" class="label">
          Erinnerung (Tage vorher) *
        </label>

        <!-- Preset-Buttons -->
        <div class="mb-3 flex flex-wrap gap-2">
          {#each [3, 7, 14, 30] as days}
            <button
              type="button"
              onclick={() => setReminderPreset(days)}
              aria-pressed={reminderDays === days}
              class="btn {reminderDays === days ? 'btn-primary' : ''}"
            >
              {days} Tage
            </button>
          {/each}
        </div>

        <input
          type="number"
          id="reminderDays"
          aria-invalid={!!fieldErrors.reminderDays}
          aria-describedby={describedBy('reminderDays', 'reminderDays-hint')}
          name="reminderDays"
          bind:value={reminderDays}
          min="1"
          max="90"
          required
          class="field"
        />
        {@render fieldError('reminderDays')}
        <p id="reminderDays-hint" class="hint">
          Du wirst <strong class="font-semibold text-ink-2">{reminderDays} Tage</strong> vor der Kündigungsfrist
          erinnert.
        </p>
      </div>

      <!-- Kosten -->
      <div>
        <label for="cost" class="label">
          Kosten (CHF) *
        </label>
        <input
          type="number"
          id="cost"
          aria-invalid={!!fieldErrors.cost}
          aria-describedby={describedBy('cost')}
          name="cost"
          bind:value={cost}
          step="0.01"
          min="0"
          required
          class="field font-mono"
        />
        {@render fieldError('cost')}
      </div>

      <!-- Abrechnungszyklus -->
      <div>
        <label for="billingCycle" class="label">
          Abrechnungszyklus *
        </label>
        <select
          id="billingCycle"
          aria-invalid={!!fieldErrors.billingCycle}
          aria-describedby={describedBy('billingCycle')}
          name="billingCycle"
          bind:value={billingCycle}
          class="field"
        >
          <option value="monthly">Monatlich</option>
          <option value="quarterly">Vierteljährlich</option>
          <option value="yearly">Jährlich</option>
        </select>
        {@render fieldError('billingCycle')}
      </div>

      <div>
        <label for="status" class="label">
          Status *
        </label>
        <select
          id="status"
          aria-invalid={!!fieldErrors.status}
          aria-describedby={describedBy('status')}
          name="status"
          bind:value={status}
          class="field"
        >
          <option value="active">Aktiv</option>
          <option value="cancelled">Gekündigt</option>
        </select>
        {@render fieldError('status')}
      </div>

      <div class="flex gap-2 pt-2">
        <button type="submit" class="btn btn-primary">
          Speichern
        </button>
        <a href="/dashboard/contracts/{contract._id}" class="btn">
          Abbrechen
        </a>
      </div>
    </form>
  </div>
</div>
