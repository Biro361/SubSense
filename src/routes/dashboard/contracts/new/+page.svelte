<script>
	import { enhance } from '$app/forms';
	import { CATEGORIES } from '$lib/constants';

	let { form } = $props();


	// Erinnerungstage State für Preset-Buttons
	let reminderDays = $state(form?.reminderDays || 7);

	//Kategorie State
	let category = $state(form?.category || 'streaming');


	// Preset-Button Handler
	function setReminderPreset(days) {
		reminderDays = days;
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
			<!-- Fehlermeldung -->
			<div role="alert" class="mb-6 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-6">
			<!-- Vertragsname -->
			<div>
				<label for="name" class="label">
					Vertragsname *
				</label>
				<input
					type="text"
					id="name"
					name="name"
					value={form?.name || ''}
					placeholder="z.B. Netflix Premium"
					required
					class="field"
				/>
			</div>

			<!-- Anbieter -->
			<div>
				<label for="provider" class="label">
					Anbieter *
				</label>
				<input
					type="text"
					id="provider"
					name="provider"
					value={form?.provider || ''}
					placeholder="z.B. Netflix Inc."
					required
					class="field"
				/>
			</div>

			<!-- Kündigungs-URL -->
			<div>
				<label for="cancellationUrl" class="label">
					Kündigungs-Link (optional)
				</label>
				<input
					type="url"
					id="cancellationUrl"
					name="cancellationUrl"
					value={form?.cancellationUrl || ''}
					placeholder="https://www.netflix.com/cancelplan"
					pattern="https?://.+"
					class="field"
				/>
				<p class="hint">
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
					name="category"
					bind:value={category}
					required
					class="field"
				>
					{#each CATEGORIES as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
				<p class="hint">
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
					name="cancellationDate"
					value={form?.cancellationDate || ''}
					required
					class="field"
				/>
				<p class="hint">
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
					name="reminderDays"
					bind:value={reminderDays}
					min="1"
					max="90"
					required
					class="field"
				/>
				<p class="hint">
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
					name="cost"
					value={form?.cost || ''}
					placeholder="0.00"
					step="0.01"
					min="0"
					required
					class="field font-mono"
				/>
				<p class="hint">
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
					name="billingCycle"
					class="field"
				>
					<option value="monthly" selected={form?.billingCycle === 'monthly'}>Monatlich</option>
					<option value="quarterly" selected={form?.billingCycle === 'quarterly'}>Vierteljährlich</option>
					<option value="yearly" selected={form?.billingCycle === 'yearly'}>Jährlich</option>
				</select>
				<p class="hint">
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
					name="status"
					class="field"
				>
					<option value="active">Aktiv</option>
					<option value="cancelled">Gekündigt</option>
				</select>
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
