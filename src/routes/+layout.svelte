<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
	
	// Prüfe, ob wir im Dashboard sind (hat eigenes Layout)
	let isDashboard = $derived(
		typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation Header (nur ausserhalb Dashboard) -->
	{#if data.user && !isDashboard}
		<header class="bg-blue-600 text-white shadow-lg">
			<nav class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
				<a href="/dashboard" class="text-2xl font-bold hover:text-blue-200 transition">
					SubSense
				</a>
				<div class="flex items-center gap-6">
					<a href="/dashboard" class="hover:text-blue-200 transition">Dashboard</a>
					<a href="/profile" class="hover:text-blue-200 transition">Profil</a>
					<form method="POST" action="/auth/logout" class="inline">
						<button
							type="submit"
							class="hover:text-blue-200 transition bg-transparent border-none cursor-pointer"
						>
							Abmelden
						</button>
					</form>
				</div>
			</nav>
		</header>
	{/if}

	<!-- Main Content -->
	<main>
		{@render children()}
	</main>
</div>
