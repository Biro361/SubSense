<!-- src/routes/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	// Toast-State für Logout-Feedback
	let showToast = $state(false);
	let toastMessage = $state('');

	// Wenn User bereits eingeloggt ist, direkt zu Dashboard
	onMount(() => {
		if (data?.user) {
			goto('/dashboard');
			return;
		}

		// Logout-Message prüfen
		const message = $page.url.searchParams.get('message');
		if (message === 'logged_out') {
			toastMessage = 'Du wurdest erfolgreich abgemeldet.';
			showToast = true;

			// Auto-dismiss nach 5 Sekunden
			setTimeout(() => {
				showToast = false;
			}, 5000);

			// URL bereinigen
			const url = new URL(window.location.href);
			url.searchParams.delete('message');
			window.history.replaceState({}, '', url);
		}
	});

	// Manuelles Schliessen
	function closeToast() {
		showToast = false;
	}
</script>

<!-- Logout-Toast (Top-Right, Fixed) -->
{#if showToast}
	<div
		class="fixed top-4 right-4 z-50 animate-slide-in-right"
		role="alert"
		aria-live="polite"
	>
		<div
			class="bg-white rounded-lg shadow-2xl border-2 border-green-500 overflow-hidden max-w-md"
		>
			<!-- Header mit Icon und Close-Button -->
			<div class="flex items-start gap-3 p-4">
				<!-- Checkmark-Icon -->
				<div
					class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
				>
					<svg
						class="w-5 h-5 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>

				<!-- Message -->
				<div class="flex-1 pt-0.5">
					<p class="text-base font-semibold text-gray-900">Erfolgreich abgemeldet!</p>
					<p class="text-sm text-gray-600 mt-1">{toastMessage}</p>
				</div>

				<!-- Close-Button -->
				<button
					onclick={closeToast}
					class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Schliessen"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<!-- Progress-Bar (5 Sekunden Animation) -->
			<div class="h-1 bg-gray-100">
				<div class="h-full bg-green-500 animate-progress-bar"></div>
			</div>
		</div>
	</div>
{/if}

<div class="landing-container">
	<!-- Background Gradient -->
	<div class="gradient-bg"></div>

	<!-- Content Card -->
	<div class="content-card">
		<!-- Logo/Icon Section -->
		<div class="logo-section">
			<div class="icon-circle">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
		</div>

		<!-- Title & Tagline -->
		<div class="text-center mb-8">
			<h1 class="title">SubSense</h1>
			<p class="tagline">Dein Vertrags-Radar</p>
			<p class="description">
				Behalte den Überblick über deine Abonnements und verpasse keine Kündigungsfrist mehr.
			</p>
		</div>

		<!-- CTA Buttons -->
		<div class="button-group">
			<a href="/auth/signin" class="btn btn-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="btn-icon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
					/>
				</svg>
				Anmelden
			</a>

			<a href="/auth/signup" class="btn btn-secondary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="btn-icon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
				Registrieren
			</a>
		</div>

		<!-- Optional: Feature-Hinweis -->
		<div class="feature-hint">
			<div class="feature-item">
				<span class="feature-icon">🔔</span>
				<span>Rechtzeitige Erinnerungen</span>
			</div>
			<div class="feature-item">
				<span class="feature-icon">💰</span>
				<span>Kostenübersicht</span>
			</div>
			<div class="feature-item">
				<span class="feature-icon">📊</span>
				<span>Alle Verträge im Blick</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* ===== TOAST ANIMATIONS ===== */
	/* Slide-In-Animation von rechts */
	@keyframes slide-in-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}

	/* Progress-Bar Animation (5 Sekunden) */
	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	.animate-progress-bar {
		animation: progress 5s linear;
	}

	/* Container & Background */
	.landing-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
	}

	.gradient-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
		z-index: -1;
	}

	/* Animated gradient effect */
	.gradient-bg::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.1) 0%,
			transparent 50%,
			rgba(255, 255, 255, 0.1) 100%
		);
		animation: gradient-shift 8s ease infinite;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			transform: translateX(-50%) translateY(-50%) rotate(0deg);
		}
		50% {
			transform: translateX(50%) translateY(50%) rotate(180deg);
		}
	}

	/* Content Card */
	.content-card {
		background: white;
		border-radius: 24px;
		padding: 3rem 2.5rem;
		max-width: 480px;
		width: 100%;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		animation: fade-in-up 0.6s ease-out;
		position: relative;
		z-index: 1;
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Logo Section */
	.logo-section {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.icon-circle {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 10px 25px rgba(59, 130, 246, 0.3),
			0 0 0 4px rgba(59, 130, 246, 0.1);
		animation: pulse-glow 3s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow:
				0 10px 25px rgba(59, 130, 246, 0.3),
				0 0 0 4px rgba(59, 130, 246, 0.1);
		}
		50% {
			box-shadow:
				0 15px 35px rgba(59, 130, 246, 0.4),
				0 0 0 8px rgba(59, 130, 246, 0.15);
		}
	}

	.icon {
		width: 48px;
		height: 48px;
		color: white;
	}

	/* Text Styles */
	.title {
		font-size: 2.5rem;
		font-weight: 800;
		color: #1e293b;
		margin-bottom: 0.5rem;
		letter-spacing: -0.025em;
	}

	.tagline {
		font-size: 1.125rem;
		color: #3b82f6;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.description {
		font-size: 0.95rem;
		color: #64748b;
		line-height: 1.6;
	}

	/* Buttons */
	.button-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.btn-icon {
		width: 20px;
		height: 20px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.btn-primary:hover {
		box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
		transform: translateY(-2px);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-secondary {
		background: white;
		color: #3b82f6;
		border: 2px solid #3b82f6;
	}

	.btn-secondary:hover {
		background: #eff6ff;
		border-color: #2563eb;
		color: #2563eb;
		transform: translateY(-2px);
	}

	.btn-secondary:active {
		transform: translateY(0);
	}

	/* Feature Hints */
	.feature-hint {
		display: flex;
		justify-content: space-around;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
		gap: 1rem;
	}

	.feature-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		font-size: 0.8rem;
		color: #64748b;
	}

	.feature-icon {
		font-size: 1.5rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.content-card {
			padding: 2rem 1.5rem;
		}

		.title {
			font-size: 2rem;
		}

		.feature-hint {
			flex-direction: column;
			gap: 1rem;
		}

		.feature-item {
			flex-direction: row;
			justify-content: center;
		}
	}
</style>
