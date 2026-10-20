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
	<div class="flex flex-1 flex-col">
		{@render children()}
	</div>
	<Footer />
</div>
