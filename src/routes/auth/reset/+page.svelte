<!-- src/routes/auth/reset/+page.svelte -->
<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let invalidLink = $derived(!data.token || form?.invalidLink === true);
</script>

<svelte:head>
	<title>Neues Passwort – SubSense</title>
	<!-- Das Token steht in der URL: nicht an fremde Seiten weitergeben -->
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<main id="main" tabindex="-1" class="flex flex-1 items-center justify-center px-4 py-12">
	<div class="w-full max-w-md rounded-card border border-line bg-surface p-8 max-sm:p-6">
		<h1 class="mb-2 text-2xl font-semibold tracking-tight">Neues Passwort</h1>
		<p class="mb-6 text-sm text-ink-2">
			Wähle ein neues Passwort. Danach meldest du dich damit an, alle anderen Sitzungen werden beendet.
		</p>

		{#if invalidLink}
			<div role="alert" class="mb-4 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
				{form?.error ?? 'Dieser Link ist ungültig oder abgelaufen.'}
			</div>
			<a href="/auth/forgot" class="btn btn-primary w-full justify-center py-3">
				Neuen Link anfordern
			</a>
		{:else}
			{#if form?.error}
				<div role="alert" class="mb-4 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-4">
				<input type="hidden" name="token" value={data.token} />

				<div>
					<label class="label" for="password">
						Neues Passwort * (mind. 8 Zeichen)
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="field"
						placeholder="••••••••"
					/>
				</div>

				<div>
					<label class="label" for="passwordConfirm">
						Passwort bestätigen *
					</label>
					<input
						id="passwordConfirm"
						name="passwordConfirm"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="field"
						placeholder="••••••••"
					/>
				</div>

				<button type="submit" class="btn btn-primary w-full justify-center py-3">
					Passwort speichern
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
