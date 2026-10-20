<!-- src/routes/auth/signin/+page.svelte -->
<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Anmelden – SubSense</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center px-4 py-12">
	<div class="w-full max-w-md rounded-card border border-line bg-surface p-8 max-sm:p-6">
		<h1 class="mb-2 text-2xl font-semibold tracking-tight">Willkommen zurück</h1>
		<p class="mb-6 text-sm text-ink-2">Melde dich an, um deine Verträge zu verwalten.</p>

		{#if form?.error}
			<div role="alert" class="mb-4 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
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
					class="field"
					placeholder="du@example.com"
				/>
			</div>

			<div>
				<label class="label" for="password">
					Passwort
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="field"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-full justify-center py-3"
			>
				Anmelden
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-ink-2">
			Noch kein Account?
			<a href="/auth/signup" class="font-medium text-accent underline-offset-2 hover:underline">
				Jetzt registrieren
			</a>
		</p>
	</div>
</main>
