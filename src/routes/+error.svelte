<!-- src/routes/+error.svelte -->
<script>
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';

	// page.error.message bewusst nicht anzeigen: bei 500ern kann sie interne Details enthalten.
	// «Erneut versuchen» nur bei Serverfehlern; bei anderen 4xx hilft Wiederholen nicht.
	let heading = $derived(
		page.status === 404
			? 'Seite nicht gefunden'
			: page.status >= 500
				? 'Etwas ist schiefgelaufen'
				: 'Das hat nicht geklappt'
	);
	let text = $derived(
		page.status === 404
			? 'Diese Adresse gibt es nicht (mehr).'
			: page.status >= 500
				? 'Versuche es in einem Moment erneut.'
				: 'Diese Anfrage kann SubSense nicht ausführen.'
	);
</script>

<svelte:head>
	<title>{heading} – SubSense</title>
</svelte:head>

<main id="main" tabindex="-1" class="flex flex-1 items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<a href="/" class="mb-8 flex items-center gap-2.5 text-ink no-underline">
			<span class="grid size-8 shrink-0 place-items-center rounded-card bg-accent text-surface">
				<Icon name="doc" size={18} />
			</span>
			<span>
				<span class="block text-lg leading-tight font-semibold tracking-tight">SubSense</span>
				<span class="block text-xs leading-none text-ink-3">Vertrags-Radar</span>
			</span>
		</a>

		<p class="mb-2 font-mono text-xs text-ink-3">Fehler {page.status}</p>
		<h1 class="mb-3 text-2xl leading-snug font-semibold tracking-tight">{heading}</h1>
		<p class="mb-8 text-ink-2">{text}</p>

		<div class="flex flex-wrap items-center gap-3">
			<a href="/dashboard" class="btn btn-primary">Zum Dashboard</a>
			<a href="/" class="btn">Zur Startseite</a>
		</div>
	</div>
</main>
