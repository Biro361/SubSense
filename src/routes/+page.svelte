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

	// Suchmaschinen und Link-Vorschau; höchstens 155 Zeichen, sonst wird gekürzt
	const DESCRIPTION =
		'Behalte Abos, Kosten und Kündigungsfristen im Blick. SubSense erinnert dich per E-Mail vor jeder Frist – kostenlos, ohne Bankverbindung.';

	// Nur belegbare Aussagen (UWG): keine Standort-, Sicherheits- oder Nutzerzahlen
	/** @type {Array<{icon: 'calendar' | 'bell' | 'external', title: string, text: string}>} */
	const BENEFITS = [
		{
			icon: 'calendar',
			title: 'Überblick über Kosten',
			text: 'Alle Abos und Verträge an einem Ort, mit den Kosten pro Monat und pro Jahr.'
		},
		{
			icon: 'bell',
			title: 'Erinnerung vor jeder Frist',
			text: 'Per E-Mail so viele Tage vor der Frist, wie du willst – oder als Datei für deinen Kalender.'
		},
		{
			icon: 'external',
			title: 'Direkt zur Kündigungsseite',
			text: 'Hinterlege den Kündigungs-Link. Wird es knapp, bist du mit einem Klick dort.'
		}
	];
</script>

<svelte:head>
	<title>SubSense – Verträge und Fristen im Blick</title>
	<!-- Nur auf der Landing: geschützte Seiten brauchen keine Link-Vorschau -->
	<meta name="description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="SubSense – Verträge und Fristen im Blick" />
	<meta property="og:description" content={DESCRIPTION} />
</svelte:head>

{#if showToast}
	<Toast message="Du wurdest erfolgreich abgemeldet." onClose={() => (showToast = false)} />
{/if}

<header class="mx-auto flex w-full max-w-[70rem] items-center justify-between gap-4 px-6 py-5 max-sm:px-4">
	<a href="/" class="flex items-center gap-2.5 text-ink no-underline">
		<span class="grid size-8 shrink-0 place-items-center rounded-card bg-accent text-surface">
			<Icon name="doc" size={18} />
		</span>
		<span>
			<span class="block text-lg leading-tight font-semibold tracking-tight">SubSense</span>
			<span class="block text-xs leading-none text-ink-3 max-sm:hidden">Vertrags-Radar</span>
		</span>
	</a>
	<nav aria-label="Konto" class="flex gap-2">
		<a href="/auth/signin" class="btn">Anmelden</a>
		<a href="/auth/signup" class="btn btn-primary">Registrieren</a>
	</nav>
</header>

<main id="main" tabindex="-1" class="mx-auto w-full max-w-[70rem] flex-1 px-6 pb-16 max-sm:px-4">
	<!-- Hero: Claim links, Vorschau rechts; gestapelt unter md -->
	<section class="grid items-center gap-12 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
		<div>
			<h1 class="text-4xl leading-[1.08] font-semibold tracking-tight text-balance max-sm:text-3xl">
				Verpasse keine Kündigungsfrist mehr.
			</h1>
			<p class="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-2">
				Behalte den Überblick über deine Abonnements: Kosten und Fristen an einem Ort, und
				SubSense erinnert dich rechtzeitig.
			</p>
			<div class="mt-8">
				<a href="/auth/signup" class="btn btn-primary cta">Kostenlos registrieren</a>
			</div>
		</div>

		<div>
			<!-- Statische Vorschau aus HTML/CSS im Stil des Dashboards; Inhalt erklärt die Bildunterschrift -->
			<div class="preview" aria-hidden="true">
				<p class="pv-kicker">Laufende Kosten</p>
				<p class="pv-figure">382.82 <i>CHF / Monat</i></p>
				<p class="pv-sub"><b>7 aktive Verträge</b> · 4’593.84 CHF im Jahr</p>

				<div class="pv-hero">
					<p class="pv-hero-top"><Icon name="alert" size={14} /> Nächste Frist</p>
					<p class="pv-hero-name">Fitnessabo</p>
					<p class="pv-hero-count">Noch 6 Tage</p>
				</div>

				<ul class="pv-rows">
					<li><span>Netflix <span class="cat">Streaming</span></span><b>15.90</b></li>
					<li><span>Halbtax <span class="cat">Transport</span></span><b>190.00</b></li>
				</ul>
			</div>
			<p class="mt-3 text-[12.5px] text-ink-3">
				Beispiel: So zeigt dir das Dashboard Monatskosten und die nächste Frist (erfundene Werte).
			</p>
		</div>
	</section>

	<!-- Drei Nutzenpunkte: dünne Linien statt Karten, wie im Dashboard -->
	<section aria-label="Was SubSense kann" class="benefits">
		{#each BENEFITS as b (b.title)}
			<div class="benefit">
				<span class="text-accent"><Icon name={b.icon} size={20} /></span>
				<h2 class="mt-3 text-base font-semibold tracking-tight">{b.title}</h2>
				<p class="mt-1.5 text-[14px] leading-relaxed text-ink-2">{b.text}</p>
			</div>
		{/each}
	</section>

	<div class="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
		<a href="/auth/signup" class="btn btn-primary cta">Kostenlos registrieren</a>
		<p class="text-[14px] text-ink-2">Kostenlos · Keine Bankverbindung nötig</p>
	</div>
</main>

<style>
	/* Grösser als der Standard-.btn: Hauptaktion der Seite, Ziel ≥ 44 px */
	.cta {
		padding: 0.85rem 1.15rem;
		font-size: 15px;
	}

	.preview {
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-line-strong);
		border-radius: var(--radius-card);
	}

	.pv-kicker {
		margin-bottom: 0.5rem;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--color-ink-3);
	}

	.pv-figure {
		font: 600 38px/1.05 var(--font-mono);
		letter-spacing: -0.03em;
	}

	.pv-figure i {
		font-style: normal;
		font-size: 0.45em;
		font-weight: 400;
		color: var(--color-ink-3);
	}

	.pv-sub {
		margin-top: 0.5rem;
		font-size: 13px;
		color: var(--color-ink-2);
	}

	.pv-sub b {
		font-weight: 600;
		color: var(--color-ink);
	}

	.pv-hero {
		margin-top: 1.25rem;
		padding: 1rem 0;
		border-top: 1px solid var(--color-line-strong);
		border-bottom: 1px solid var(--color-line);
	}

	.pv-hero-top {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-warn);
	}

	.pv-hero-name {
		margin-top: 0.4rem;
		font-size: 18px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.pv-hero-count {
		margin-top: 0.3rem;
		font: 600 24px/1 var(--font-mono);
		color: var(--color-warn);
	}

	.pv-rows li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 0;
		font-size: 14px;
		font-weight: 600;
		border-bottom: 1px solid var(--color-line);
	}

	.pv-rows li:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.pv-rows .cat {
		margin-left: 0.4rem;
	}

	.pv-rows b {
		font: 600 14px var(--font-mono);
	}

	.benefits {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--color-line-strong);
		border-bottom: 1px solid var(--color-line-strong);
	}

	.benefit {
		padding: 1.5rem 1.5rem 1.5rem 0;
		border-right: 1px solid var(--color-line);
	}

	.benefit + .benefit {
		padding-left: 1.5rem;
	}

	.benefit:last-child {
		border-right: 0;
	}

	@media (max-width: 767px) {
		.benefits {
			grid-template-columns: 1fr;
		}

		.benefit,
		.benefit + .benefit {
			padding: 1.25rem 0;
			border-right: 0;
			border-bottom: 1px solid var(--color-line);
		}

		.benefit:last-child {
			border-bottom: 0;
		}
	}
</style>
