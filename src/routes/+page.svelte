<!-- src/routes/+page.svelte -->
<script>
	import { onMount, tick } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import Toast from '$lib/components/Toast.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();

	// Toast-State für Logout-Feedback
	let showToast = $state(false);

	// Wenn User bereits eingeloggt ist, direkt zu Dashboard
	onMount(async () => {
		if (data?.user) {
			goto('/dashboard');
			return;
		}

		// Logout-Message prüfen
		const message = $page.url.searchParams.get('message');
		if (message === 'logged_out') {
			showToast = true;

			// URL bereinigen
			const url = new URL(window.location.href);
			url.searchParams.delete('message');
			// Erst nach tick(): beim ersten Laden ist der Router in onMount noch nicht bereit
			await tick();
			replaceState(url, {});
		}
	});
</script>

<svelte:head>
	<title>SubSense – Verträge und Fristen im Blick</title>
</svelte:head>

{#if showToast}
	<Toast message="Du wurdest erfolgreich abgemeldet." onClose={() => (showToast = false)} />
{/if}

<main class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 flex items-center gap-2.5">
			<span class="grid size-8 shrink-0 place-items-center rounded-card bg-accent text-surface">
				<Icon name="doc" size={18} />
			</span>
			<div>
				<h1 class="text-lg leading-tight font-semibold tracking-tight">SubSense</h1>
				<p class="text-xs leading-none text-ink-3">Vertrags-Radar</p>
			</div>
		</div>

		<p class="mb-8 text-2xl leading-snug font-semibold tracking-tight">
			Behalte den Überblick über deine Abonnements und verpasse keine Kündigungsfrist mehr.
		</p>

		<div class="flex flex-wrap gap-3">
			<a href="/auth/signin" class="btn btn-primary">Anmelden</a>
			<a href="/auth/signup" class="btn">Registrieren</a>
		</div>
	</div>
</main>
