<!-- src/lib/components/Icon.svelte -->
<script>
	// Jeder Eintrag ist eine Liste von Pfaden, damit auch mehrteilige Icons (Lupe) funktionieren
	const PATHS = {
		search: ['M20 20l-3.5-3.5', 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0'],
		eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
		pencil: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'],
		trash: ['M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14'],
		download: ['M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'],
		upload: ['M12 15V3m0 0L8 7m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'],
		plus: ['M12 5v14M5 12h14'],
		alert: [
			'M12 9v4m0 4h.01',
			'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'
		],
		external: [
			'M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4',
			'M14 4h6m0 0v6m0-6L10 14'
		],
		check: ['M5 13l4 4L19 7'],
		x: ['M6 18L18 6M6 6l12 12'],
		user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7'],
		chevron: ['M19 9l-7 7-7-7'],
		bell: ['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
		calendar: [
			'M8 2v4M16 2v4M3 10h18',
			'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'
		],
		logout: [
			'M17 16l4-4m0 0l-4-4m4 4H7',
			'M13 16v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1'
		],
		doc: [
			'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2Z'
		]
	};

	/** @type {{ name: keyof typeof PATHS, size?: number, class?: string }} */
	let { name, size = 16, class: className = '' } = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each PATHS[name] ?? [] as d}<path {d} />{/each}
</svg>
