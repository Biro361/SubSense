<script>
	import { enhance } from '$app/forms';
	import { CATEGORIES } from '$lib/constants';

	let { form } = $props();


	// Erinnerungstage State für Preset-Buttons
	let reminderDays = $state(Number(form?.reminderDays) || 7);

	//Kategorie State
	let category = $state(form?.category || 'streaming');

	// Übrige Felder als State: ein Re-Render (z. B. Preset-Klick) setzt sonst die Startwerte zurück
	let name = $state(form?.name || '');
	let provider = $state(form?.provider || '');
	let cancellationUrl = $state(form?.cancellationUrl || '');
	let cancellationDate = $state(form?.cancellationDate || '');
	let cost = $state(form?.cost || '');
	let billingCycle = $state(form?.billingCycle || 'monthly');
	let status = $state(form?.status || 'active');

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
	<title>Neuer Vertrag – SubSense</title>
</svelte:head>

<div class="mx-auto max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
	<div class="max-w-2xl">
		<a href="/" class="text-[13px] text-ink-2 hover:text-ink">
			← Zurück zur Übersicht
		</a>
		<h1 class="mt-4 mb-8 text-3xl font-semibold tracking-tight">Neuer Vertrag</h1>

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
			<!-- Vertragsname -->
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
					placeholder="z.B. Netflix Premium"
					required
					class="field"
				/>
				{@render fieldError('name')}
			</div>

			<!-- Anbieter -->
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
					placeholder="z.B. Netflix Inc."
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

			<!-- Kategorie -->
			<div>
				<label for="category" class="label">
					Kategorie *
				</label>
				<select
					id="category"
					aria-invalid={!!fieldErrors.category}
					aria-describedby={describedBy('category', 'category-hint')}
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
				<p id="category-hint" class="hint">
					Hilft dir, deine Verträge zu organisieren
				</p>
			</div>

			<!-- Kündigungsdatum -->
			<div>
				<label for="cancellationDate" class="label">
					Kündigungsfrist (Datum) *
				</label>
				<input
					type="date"
					id="cancellationDate"
					aria-invalid={!!fieldErrors.cancellationDate}
					aria-describedby={describedBy('cancellationDate', 'cancellationDate-hint')}
					name="cancellationDate"
					bind:value={cancellationDate}
					required
					class="field"
				/>
				{@render fieldError('cancellationDate')}
				<p id="cancellationDate-hint" class="hint">
					Bis wann kannst du den Vertrag kündigen?
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
					Du wirst <strong class="font-semibold text-ink-2">{reminderDays} Tage</strong> vor der Kündigungsfrist erinnert.
					Praktisch für Test-Abos oder wichtige Fristen.
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
					aria-describedby={describedBy('cost', 'cost-hint')}
					name="cost"
					bind:value={cost}
					placeholder="0.00"
					step="0.01"
					min="0"
					required
					class="field font-mono"
				/>
				{@render fieldError('cost')}
				<p id="cost-hint" class="hint">
					Wie viel kostet der Vertrag pro Abrechnungsperiode?
				</p>
			</div>

			<!-- Abrechnungszyklus -->
			<div>
				<label for="billingCycle" class="label">
					Abrechnungszyklus *
				</label>
				<select
					id="billingCycle"
					aria-invalid={!!fieldErrors.billingCycle}
					aria-describedby={describedBy('billingCycle', 'billingCycle-hint')}
					name="billingCycle"
					bind:value={billingCycle}
					class="field"
				>
					<option value="monthly">Monatlich</option>
					<option value="quarterly">Vierteljährlich</option>
					<option value="yearly">Jährlich</option>
				</select>
				{@render fieldError('billingCycle')}
				<p id="billingCycle-hint" class="hint">
					Wie oft wird der Betrag abgerechnet?
				</p>
			</div>

			<!-- Status -->
			<div>
				<label for="status" class="label">
					Status
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

			<!-- Buttons -->
			<div class="flex gap-2 pt-2">
				<button type="submit" class="btn btn-primary">
					Vertrag speichern
				</button>
				<a href="/" class="btn">
					Abbrechen
				</a>
			</div>
		</form>
	</div>
</div>
