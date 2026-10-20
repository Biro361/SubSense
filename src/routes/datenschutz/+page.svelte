<!-- src/routes/datenschutz/+page.svelte -->
<!-- Statischer Inhalt ohne +page.server.js: die Seite ist auch ausgeloggt erreichbar -->
<script>
	import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>Datenschutz – SubSense</title>
</svelte:head>

<main class="mx-auto w-full max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
	<a href="/" class="mb-10 inline-flex items-center gap-2.5">
		<span class="grid size-8 shrink-0 place-items-center rounded-card bg-accent text-surface">
			<Icon name="doc" size={18} />
		</span>
		<span>
			<span class="block text-lg leading-tight font-semibold tracking-tight">SubSense</span>
			<span class="block text-xs leading-none text-ink-3">Vertrags-Radar</span>
		</span>
	</a>

	<div class="max-w-2xl">
		<h1 class="mb-2 text-3xl font-semibold tracking-tight">Datenschutzerklärung</h1>
		<p class="mb-8 text-sm text-ink-2">Stand: [BETREIBER: Datum der Freigabe eintragen]</p>

		<section class="border-t border-line-strong py-6">
			<h2 class="mb-3 font-semibold">Verantwortlich</h2>
			<p class="text-sm text-ink-2">
				Birhat Özcan (Privatperson)<br />
				E-Mail: birhat.oezcan@gmail.com
			</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Welche Daten bearbeitet werden</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Datenliste eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Zwecke</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Zwecke eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Empfänger und Speicherorte</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Empfänger und Speicherorte eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Bekanntgabe ins Ausland</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Staaten und Garantien eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Aufbewahrung und Löschung</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Aufbewahrung und Löschung eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Cookies</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Cookies eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Deine Rechte</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Rechte und Kontaktweg eintragen]</p>
		</section>

		<section class="border-t border-line py-6">
			<h2 class="mb-3 font-semibold">Links zu anderen Websites</h2>
			<p class="text-sm text-ink-2">[BETREIBER: Hinweis zu externen Links eintragen]</p>
		</section>
	</div>
</main>
