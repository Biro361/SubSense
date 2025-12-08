<script>
	import { enhance } from '$app/forms';
	
	let { form } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<a href="/" class="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
				← Zurück zur Übersicht
			</a>
			<h1 class="text-3xl font-bold text-gray-900">Neuer Vertrag</h1>
		</div>
	</header>

	<!-- Formular -->
	<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			
			{#if form?.error}
				<!-- Fehlermeldung -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
					⚠️ {form.error}
				</div>
			{/if}
			
			<form method="POST" use:enhance>
				<!-- Vertragsname -->
				<div class="mb-6">
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						Vertragsname *
					</label>
					<input
						type="text"
						id="name"
						name="name"
						value={form?.name || ''}
						placeholder="z.B. Netflix Premium"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- Anbieter -->
				<div class="mb-6">
					<label for="provider" class="block text-sm font-medium text-gray-700 mb-2">
						Anbieter *
					</label>
					<input
						type="text"
						id="provider"
						name="provider"
						value={form?.provider || ''}
						placeholder="z.B. Netflix Inc."
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- Kündigungsdatum -->
				<div class="mb-6">
					<label for="cancellationDate" class="block text-sm font-medium text-gray-700 mb-2">
						Kündigungsfrist (Datum) *
					</label>
					<input
						type="date"
						id="cancellationDate"
						name="cancellationDate"
						value={form?.cancellationDate || ''}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="text-sm text-gray-500 mt-1">
						Bis wann kannst du den Vertrag kündigen?
					</p>
				</div>

				<!-- NEU: Kosten -->
				<div class="mb-6">
					<label for="cost" class="block text-sm font-medium text-gray-700 mb-2">
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
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="text-sm text-gray-500 mt-1">
						Wie viel kostet der Vertrag pro Abrechnungsperiode?
					</p>
				</div>

				<!-- NEU: Abrechnungszyklus -->
				<div class="mb-6">
					<label for="billingCycle" class="block text-sm font-medium text-gray-700 mb-2">
						Abrechnungszyklus *
					</label>
					<select
						id="billingCycle"
						name="billingCycle"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="monthly" selected={form?.billingCycle === 'monthly'}>Monatlich</option>
						<option value="quarterly" selected={form?.billingCycle === 'quarterly'}>Vierteljährlich</option>
						<option value="yearly" selected={form?.billingCycle === 'yearly'}>Jährlich</option>
					</select>
					<p class="text-sm text-gray-500 mt-1">
						Wie oft wird der Betrag abgerechnet?
					</p>
				</div>

				<!-- Status -->
				<div class="mb-6">
					<label for="status" class="block text-sm font-medium text-gray-700 mb-2">
						Status
					</label>
					<select
						id="status"
						name="status"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="active">Aktiv</option>
						<option value="cancelled">Gekündigt</option>
					</select>
				</div>

				<!-- Buttons -->
				<div class="flex gap-4">
					<button
						type="submit"
						class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
					>
						Vertrag speichern
					</button>
					<a
						href="/"
						class="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition text-center"
					>
						Abbrechen
					</a>
				</div>
			</form>
		</div>
	</main>
</div>
