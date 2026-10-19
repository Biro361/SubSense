<!-- src/lib/components/Toast.svelte -->
<script>
	let { message = '', type = 'success', onClose = () => {} } = $props();

	let visible = $state(true);

	// Auto-Hide nach 5 Sekunden; Fehler bleiben stehen, bis sie gelesen/geschlossen sind
	$effect(() => {
		if (type === 'error') return;

		const timer = setTimeout(() => {
			visible = false;
			setTimeout(onClose, 300); // Warte auf Animation
		}, 5000);

		return () => clearTimeout(timer);
	});

	function handleClose() {
		visible = false;
		setTimeout(onClose, 300);
	}

	const typeStyles = {
		success: 'border-ok/40 text-ok',
		error: 'border-crit/40 text-crit',
		info: 'border-accent/40 text-accent'
	};

	const icons = {
		success: 'M5 13l4 4L19 7',
		error: 'M6 18L18 6M6 6l12 12',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};
</script>

{#if visible}
	<div
		class="toast {typeStyles[type]}"
		role={type === 'error' ? 'alert' : 'status'}
	>
		<div class="toast-icon">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons[type]} />
			</svg>
		</div>
		<p class="toast-message">{message}</p>
		<button onclick={handleClose} class="toast-close" aria-label="Schliessen">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		/* Deckend, da der Toast über dem Inhalt liegt */
		background: var(--color-surface);
		border-radius: var(--radius-card);
		border: 1px solid;
		box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.12);
		max-width: 24rem;
		z-index: 9999;
		animation: toast-slide-in 0.3s ease;
	}

	@keyframes toast-slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.toast-icon {
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-weight: 500;
		font-size: 0.875rem;
		margin: 0;
	}

	.toast-close {
		flex-shrink: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--radius-card);
		transition: background 0.2s;
		opacity: 0.7;
	}

	.toast-close:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.05);
	}

	@media (max-width: 640px) {
		.toast {
			left: 1rem;
			right: 1rem;
			max-width: none;
		}
	}
</style>
