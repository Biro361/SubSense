<!-- src/lib/components/Toast.svelte -->
<script>
	let { message = '', type = 'success', onClose = () => {} } = $props();

	let visible = $state(true);

	// Auto-Hide nach 5 Sekunden
	$effect(() => {
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
		success: 'bg-green-50 border-green-200 text-green-800',
		error: 'bg-red-50 border-red-200 text-red-800',
		info: 'bg-blue-50 border-blue-200 text-blue-800'
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
		role="alert"
		aria-live="polite"
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
		border-radius: 0.75rem;
		border: 1px solid;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
		border-radius: 0.25rem;
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
