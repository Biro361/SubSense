<!-- src/routes/auth/forgot/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Passwort zurücksetzen – SubSense</title>
</svelte:head>

<main id="main" tabindex="-1" class="flex flex-1 items-center justify-center px-4 py-12">
	<div class="w-full max-w-md rounded-card border border-line bg-surface p-8 max-sm:p-6">
		<h1 class="mb-2 text-2xl font-semibold tracking-tight">Passwort zurücksetzen</h1>
		<p class="mb-6 text-sm text-ink-2">
			Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link für ein neues Passwort.
		</p>

		{#if form?.sent}
			<!-- Immer gleich, ob es das Konto gibt oder nicht -->
			<div role="status" class="mb-4 flex items-start gap-3 rounded-card border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">
				<Icon name="check" class="mt-0.5 shrink-0" />
				<p>
					Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link geschickt.
					Er ist 30 Minuten gültig. Prüfe auch den Spam-Ordner.
				</p>
			</div>
		{:else}
			{#if form?.error}
				<div role="alert" class="mb-4 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					// Die Antwort dauert absichtlich rund 2 s: Doppelklicks abfangen
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
				class="space-y-4"
			>
				<div>
					<label class="label" for="email">
						E-Mail-Adresse
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						value={form?.email ?? ''}
						class="field"
						placeholder="du@example.com"
					/>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="btn btn-primary w-full justify-center py-3"
				>
					{submitting ? 'Wird gesendet …' : 'Link senden'}
				</button>
			</form>
		{/if}

		<p class="mt-6 text-center text-sm text-ink-2">
			<a href="/auth/signin" class="font-medium text-accent underline-offset-2 hover:underline">
				Zurück zur Anmeldung
			</a>
		</p>
	</div>
</main>
