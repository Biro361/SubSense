<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Spalte über die ganze Fensterhöhe: auf kurzen Seiten sitzt der Footer am unteren Rand -->
<div class="flex min-h-screen flex-col">
	<!-- Erstes Tab-Ziel jeder Seite; Ziel ist <main id="main"> der Seite.
	     Die SvelteKit-Standardfehlerseite hat keins, bis es eine eigene +error.svelte gibt -->
	<a href="#main" class="skip-link">Zum Inhalt springen</a>
	<div class="flex flex-1 flex-col">
		{@render children()}
	</div>
	<Footer />
</div>
