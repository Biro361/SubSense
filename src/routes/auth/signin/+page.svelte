<!-- src/routes/auth/signin/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();
	let justRegistered = $derived($page.url.searchParams.get('registered') === '1');
</script>

<svelte:head>
	<title>Anmelden – SubSense</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-2">Willkommen zurück</h1>
		<p class="text-gray-600 mb-6">Melde dich an, um deine Verträge zu verwalten.</p>

		{#if justRegistered}
			<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
				✅ Account erfolgreich erstellt! Du kannst dich jetzt anmelden.
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="email">
					Email-Adresse
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					placeholder="du@example.com"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="password">
					Passwort
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
			>
				Anmelden
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Noch kein Account?
			<a href="/auth/signup" class="font-medium text-blue-600 hover:text-blue-700">
				Jetzt registrieren
			</a>
		</p>
	</div>
</main>
