<script>
	import { enhance } from '$app/forms';

	/** @type {import('./$types').PageData} */
	/** @type {import('./$types').ActionData} */
	let { data, form } = $props();

	let showPasswordForm = $state(false);
	let showDeleteForm = $state(false);
</script>

<svelte:head>
	<title>Mein Profil – SubSense</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-6">Mein Profil</h1>

	<!-- Erfolgsmeldung -->
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
			<p class="font-medium">{form.message}</p>
		</div>
	{/if}

	<!-- Fehlermeldung -->
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
			<p class="font-medium">{form.error}</p>
		</div>
	{/if}

	<!-- Profil-Info -->
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Profil-Informationen</h2>
		<dl class="space-y-3">
			<div>
				<dt class="text-sm font-medium text-gray-500">E-Mail</dt>
				<dd class="text-lg">{data.user.email}</dd>
			</div>
			<div>
				<dt class="text-sm font-medium text-gray-500">Name</dt>
				<dd class="text-lg">{data.user.name}</dd>
			</div>
			<div>
				<dt class="text-sm font-medium text-gray-500">Mitglied seit</dt>
				<dd class="text-lg">
					{new Date(data.user.createdAt).toLocaleDateString('de-CH')}
				</dd>
			</div>
		</dl>
	</div>

	<!-- Name ändern -->
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Name ändern</h2>
		<form method="POST" action="?/updateName" use:enhance>
			<div class="mb-4">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					Neuer Name
				</label>
				<input
					type="text"
					id="name"
					name="name"
					value={data.user.name}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>
			<button
				type="submit"
				class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
			>
				Name speichern
			</button>
		</form>
	</div>

	<!-- E-Mail ändern -->
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">E-Mail ändern</h2>
		<form method="POST" action="?/updateEmail" use:enhance>
			<div class="mb-4">
				<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
					Neue E-Mail-Adresse
				</label>
				<input
					type="email"
					id="email"
					name="email"
					value={data.user.email}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>
			<button
				type="submit"
				class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
			>
				E-Mail speichern
			</button>
		</form>
	</div>

	<!-- Passwort ändern -->
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Passwort ändern</h2>

		{#if !showPasswordForm}
			<button
				onclick={() => (showPasswordForm = true)}
				class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
			>
				Passwort ändern
			</button>
		{:else}
			<form method="POST" action="?/updatePassword" use:enhance>
				<div class="mb-4">
					<label for="oldPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Altes Passwort
					</label>
					<input
						type="password"
						id="oldPassword"
						name="oldPassword"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Neues Passwort (min. 8 Zeichen)
					</label>
					<input
						type="password"
						id="newPassword"
						name="newPassword"
						minlength="8"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Neues Passwort bestätigen
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						minlength="8"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div class="flex gap-3">
					<button
						type="submit"
						class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
					>
						Passwort speichern
					</button>
					<button
						type="button"
						onclick={() => (showPasswordForm = false)}
						class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
					>
						Abbrechen
					</button>
				</div>
			</form>
		{/if}
	</div>

	<!-- Account löschen (Danger Zone) -->
	<div class="bg-red-50 border border-red-200 rounded-lg p-6">
		<h2 class="text-xl font-semibold text-red-800 mb-4">Gefahrenzone</h2>
		<p class="text-sm text-gray-700 mb-4">
			Das Löschen deines Accounts ist <strong>unwiderruflich</strong>. Alle deine Verträge
			werden ebenfalls gelöscht.
		</p>

		{#if !showDeleteForm}
			<button
				onclick={() => (showDeleteForm = true)}
				class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
			>
				Account löschen
			</button>
		{:else}
			<form method="POST" action="?/deleteAccount" use:enhance>
				<div class="mb-4">
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Passwort zur Bestätigung
					</label>
					<input
						type="password"
						id="password"
						name="password"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="confirmation" class="block text-sm font-medium text-gray-700 mb-2">
						Gib "LÖSCHEN" ein, um zu bestätigen
					</label>
					<input
						type="text"
						id="confirmation"
						name="confirmation"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
						placeholder="LÖSCHEN"
						required
					/>
				</div>
				<div class="flex gap-3">
					<button
						type="submit"
						class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
					>
						Unwiderruflich löschen
					</button>
					<button
						type="button"
						onclick={() => (showDeleteForm = false)}
						class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
					>
						Abbrechen
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
