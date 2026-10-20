<script>
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/Toast.svelte';

	/** @type {import('./$types').PageData} */
	/** @type {import('./$types').ActionData} */
	let { data, form } = $props();

	let showPasswordForm = $state(false);
	let showDeleteForm = $state(false);

	// Toast State
	let toastMessage = $state('');
	let toastType = $state('success');
	let showToast = $state(false);

	// Toast bei Form-Ergebnis anzeigen
	$effect(() => {
		if (form?.success) {
			toastMessage = form.message;
			toastType = 'success';
			showToast = true;
		} else if (form?.error) {
			toastMessage = form.error;
			toastType = 'error';
			showToast = true;
		}
	});
</script>

<svelte:head>
	<title>Mein Profil – SubSense</title>
</svelte:head>

<!-- Toast-Benachrichtigungen -->
{#if showToast}
	<Toast
		message={toastMessage}
		type={toastType}
		onClose={() => (showToast = false)}
	/>
{/if}

<div class="mx-auto max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
	<div class="max-w-2xl">
		<h1 class="mb-8 text-3xl font-semibold tracking-tight">Mein Profil</h1>

		<!-- Profil-Info -->
		<section class="border-t border-line-strong py-6">
			<h2 class="mb-4 font-semibold">Profil-Informationen</h2>
			<dl class="grid gap-4 sm:grid-cols-3">
				<div class="min-w-0">
					<dt class="label">E-Mail</dt>
					<dd class="[overflow-wrap:anywhere]">{data.user.email}</dd>
				</div>
				<div class="min-w-0">
					<dt class="label">Name</dt>
					<dd>{data.user.name}</dd>
				</div>
				<div>
					<dt class="label">Mitglied seit</dt>
					<dd class="font-mono">
						{new Date(data.user.createdAt).toLocaleDateString('de-CH')}
					</dd>
				</div>
			</dl>
		</section>

		<!-- Name ändern -->
		<section class="border-t border-line py-6">
			<h2 class="mb-4 font-semibold">Name ändern</h2>
			<form method="POST" action="?/updateName" use:enhance>
				<div class="mb-4">
					<label for="name" class="label">
						Neuer Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						autocomplete="name"
						value={data.user.name}
						class="field"
						required
					/>
				</div>
				<button type="submit" class="btn btn-primary">
					Name speichern
				</button>
			</form>
		</section>

		<!-- E-Mail ändern -->
		<section class="border-t border-line py-6">
			<h2 class="mb-4 font-semibold">E-Mail ändern</h2>
			<form method="POST" action="?/updateEmail" use:enhance>
				<div class="mb-4">
					<label for="email" class="label">
						Neue E-Mail-Adresse
					</label>
					<input
						type="email"
						id="email"
						name="email"
						autocomplete="email"
						value={data.user.email}
						class="field"
						required
					/>
				</div>
				<button type="submit" class="btn btn-primary">
					E-Mail speichern
				</button>
			</form>
		</section>

		<!-- Passwort ändern -->
		<section class="border-t border-line py-6">
			<h2 class="mb-4 font-semibold">Passwort ändern</h2>

			{#if !showPasswordForm}
				<button onclick={() => (showPasswordForm = true)} class="btn">
					Passwort ändern
				</button>
			{:else}
				<form method="POST" action="?/updatePassword" use:enhance class="space-y-4">
					<div>
						<label for="oldPassword" class="label">
							Altes Passwort
						</label>
						<input
							type="password"
							id="oldPassword"
							name="oldPassword"
							autocomplete="current-password"
							class="field"
							required
						/>
					</div>
					<div>
						<label for="newPassword" class="label">
							Neues Passwort (min. 8 Zeichen)
						</label>
						<input
							type="password"
							id="newPassword"
							name="newPassword"
							autocomplete="new-password"
							minlength="8"
							class="field"
							required
						/>
					</div>
					<div>
						<label for="confirmPassword" class="label">
							Neues Passwort bestätigen
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							autocomplete="new-password"
							minlength="8"
							class="field"
							required
						/>
					</div>
					<div class="flex gap-2">
						<button type="submit" class="btn btn-primary">
							Passwort speichern
						</button>
						<button type="button" onclick={() => (showPasswordForm = false)} class="btn">
							Abbrechen
						</button>
					</div>
				</form>
			{/if}
		</section>

		<!-- Account löschen (Gefahrenzone): bewusst abgesetzt, damit es nicht wie eine Nebenaktion wirkt -->
		<section class="mt-6 rounded-card border border-crit/40 bg-crit/5 p-6">
			<h2 class="mb-2 font-semibold text-crit">Gefahrenzone</h2>
			<p class="mb-4 text-sm text-ink-2">
				Das Löschen deines Accounts ist <strong class="text-ink">unwiderruflich</strong>. Alle deine Verträge
				werden ebenfalls gelöscht.
			</p>

			{#if !showDeleteForm}
				<button onclick={() => (showDeleteForm = true)} class="btn btn-danger">
					Account löschen
				</button>
			{:else}
				<form method="POST" action="?/deleteAccount" use:enhance class="space-y-4">
					<div>
						<label for="password" class="label">
							Passwort zur Bestätigung
						</label>
						<input
							type="password"
							id="password"
							name="password"
							autocomplete="current-password"
							class="field"
							required
						/>
					</div>
					<div>
						<label for="confirmation" class="label">
							Gib "LÖSCHEN" ein, um zu bestätigen
						</label>
						<input
							type="text"
							id="confirmation"
							name="confirmation"
							class="field"
							placeholder="LÖSCHEN"
							required
						/>
					</div>
					<div class="flex gap-2">
						<button type="submit" class="btn btn-danger">
							Unwiderruflich löschen
						</button>
						<button type="button" onclick={() => (showDeleteForm = false)} class="btn">
							Abbrechen
						</button>
					</div>
				</form>
			{/if}
		</section>
	</div>
</div>
