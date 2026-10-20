<!-- src/lib/components/Footer.svelte -->
<footer class="border-t border-line">
	<div
		class="mx-auto flex max-w-[70rem] flex-wrap items-center gap-x-2 gap-y-1 px-6 py-4 text-[12.5px] text-ink-2 max-sm:px-4"
	>
		<span>© {new Date().getFullYear()} SubSense</span>
		<span aria-hidden="true">·</span>
		<!-- Eigene nav, damit ein weiterer Rechtslink ohne Umbau dazukommt -->
		<nav aria-label="Rechtliches">
			<a href="/datenschutz" class="underline-offset-2 hover:underline">Datenschutz</a>
		</nav>
	</div>
</footer>
