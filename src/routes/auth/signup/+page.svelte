<!-- src/routes/auth/signup/+page.svelte -->
<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Registrieren – SubSense</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center px-4 py-12">
	<div class="w-full max-w-md rounded-card border border-line bg-surface p-8 max-sm:p-6">
		<h1 class="mb-2 text-2xl font-semibold tracking-tight">Account erstellen</h1>
		<p class="mb-6 text-sm text-ink-2">
			Registriere dich mit deiner Email und verwalte deine Verträge persönlich.
		</p>

		{#if form?.error}
			<div role="alert" class="mb-4 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label class="label" for="name">
					Name (optional)
				</label>
				<input
					id="name"
					name="name"
					type="text"
					class="field"
					placeholder="Max Muster"
				/>
			</div>

			<div>
				<label class="label" for="email">
					Email-Adresse *
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					class="field"
					placeholder="du@example.com"
				/>
			</div>

			<div>
				<label class="label" for="password">
					Passwort * (mind. 8 Zeichen)
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="8"
					class="field"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-full justify-center py-3"
			>
				Account erstellen
			</button>

			<p class="text-center text-[12.5px] text-ink-2">
				Mit der Registrierung nimmst du die
				<a href="/datenschutz" class="font-medium text-accent underline-offset-2 hover:underline">
					Datenschutzerklärung
				</a>
				zur Kenntnis.
			</p>
		</form>

		<p class="mt-6 text-center text-sm text-ink-2">
			Bereits einen Account?
			<a href="/auth/signin" class="font-medium text-accent underline-offset-2 hover:underline">
				Zum Login
			</a>
		</p>
	</div>
</main>
