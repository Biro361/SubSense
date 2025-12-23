<!-- src/routes/auth/error/+page.svelte -->
<script>
	import { page } from '$app/stores';
	
	let errorType = $derived($page.url.searchParams.get('error') || 'Unknown');
</script>

<svelte:head>
	<title>Fehler – SubSense</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
		<div class="text-red-500 text-5xl mb-4">⚠️</div>
		<h1 class="text-2xl font-semibold text-gray-900 mb-2">Authentifizierungsfehler</h1>
		<p class="text-gray-600 mb-6">
			{#if errorType === 'Configuration'}
				Es gab ein Problem mit der Authentifizierungs-Konfiguration.
			{:else}
				Ein Fehler ist aufgetreten: {errorType}
			{/if}
		</p>
		<a 
			href="/auth/signin"
			class="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			Zurück zum Login
		</a>
	</div>
</main>
