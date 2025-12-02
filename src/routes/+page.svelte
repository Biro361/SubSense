<script>
	import { page } from '$app/stores';
	
	let { data } = $props();
	
	let contracts = $derived(data.contracts || []);
	let hasContracts = $derived(contracts.length > 0);
	let showSuccess = $derived($page.url.searchParams.get('success') === 'created');
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">SubSense</h1>
					<p class="text-gray-600 mt-1">Dein Vertrags-Radar</p>
				</div>
				<a 
					href="/contracts/new" 
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
				>
					+ Neuer Vertrag
				</a>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if showSuccess}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-6">
				✓ Vertrag erfolgreich erstellt!
			</div>
		{/if}

		{#if data.error}
			<!-- Fehlermeldung -->
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
				⚠️ {data.error}
			</div>
		{:else if !hasContracts}
			<!-- Empty State -->
			<div class="text-center py-12">
				<div class="text-6xl mb-4">📄</div>
				<h2 class="text-2xl font-semibold text-gray-700 mb-2">
					Noch keine Verträge erfasst
				</h2>
				<p class="text-gray-500 mb-6">
					Lege deinen ersten Vertrag an, um den Überblick zu behalten.
				</p>
				<a 
					href="/contracts/new" 
					class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
				>
					Ersten Vertrag anlegen
				</a>
			</div>
		{:else}
			<!-- Vertrags-Liste -->
			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-gray-800 mb-4">
					Alle Verträge ({contracts.length})
				</h2>
				
				{#each contracts as contract (contract._id)}
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-gray-900">
									{contract.name}
								</h3>
								<p class="text-gray-600 mt-1">
									Anbieter: {contract.provider}
								</p>
								<p class="text-sm text-gray-500 mt-2">
									Kündigung möglich bis: 
									<span class="font-medium">
										{new Date(contract.cancellationDate).toLocaleDateString('de-DE')}
									</span>
								</p>
							</div>
							
							<!-- Status Badge -->
							<span 
								class="px-3 py-1 rounded-full text-sm font-medium {contract.status === 'active' 
									? 'bg-green-100 text-green-800' 
									: 'bg-gray-100 text-gray-800'}"
							>
								{contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
