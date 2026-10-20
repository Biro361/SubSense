<!-- src/routes/dashboard/+layout.svelte -->
<script>
	import Icon from "$lib/components/Icon.svelte";

	let { data, children } = $props();

	// User-Dropdown State
	let showUserMenu = $state(false);

	// Logout-Bestätigung State
	let showLogoutConfirm = $state(false);

	// CSV-Export State
	let isExporting = $state(false);

	// User-Email extrahieren
	let userEmail = $derived(data.user?.email || "Nutzer");

	// CSV-Export Handler
	async function handleExport() {
		isExporting = true;
		try {
			const response = await fetch("/api/export");

			if (!response.ok) {
				throw new Error("Export fehlgeschlagen");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const date = new Date().toISOString().split("T")[0];
			a.download = `subsense_export_${date}.csv`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Export error:", error);
			alert("Export fehlgeschlagen. Bitte versuche es erneut.");
		} finally {
			isExporting = false;
		}
	}

	// Logout-Flow starten
	function handleLogoutClick() {
		showUserMenu = false; // Dropdown schliessen
		showLogoutConfirm = true; // Bestätigung anzeigen
	}

	// Logout abbrechen
	function cancelLogout() {
		showLogoutConfirm = false;
	}

	// Click-Outside-Handler für Dropdown
	function handleClickOutside(event) {
		const target = event.target;
		if (showUserMenu && !target.closest(".user-dropdown")) {
			showUserMenu = false;
		}
	}

	// Keyboard-Handler für Modal und Dropdown (Escape-Taste)
	function handleKeydown(event) {
		if (event.key !== "Escape") return;
		if (showLogoutConfirm) {
			cancelLogout();
		} else if (showUserMenu) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<!-- Fixed Header -->
<header class="dashboard-header">
	<div class="header-container">
		<!-- Logo/Titel -->
		<a href="/dashboard" class="logo-link">
			<span class="logo-icon"><Icon name="doc" size={18} /></span>
			<div>
				<h1 class="logo-title">SubSense</h1>
				<p class="logo-subtitle">Vertrags-Radar</p>
			</div>
		</a>

		<!-- Navigation -->
		<nav class="nav-section">
			<!-- CSV-Import/Export-Buttons -->
			<div class="csv-actions">
				<button
					onclick={handleExport}
					disabled={isExporting}
					class="btn"
					aria-label="CSV exportieren"
					title="Alle Verträge als CSV exportieren"
				>
					{#if isExporting}
						<svg
							class="animate-spin"
							width="15"
							height="15"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{:else}
						<Icon name="download" size={15} />
					{/if}
					<span class="btn-text">Export</span>
				</button>

				<a
					href="/dashboard/import"
					class="btn"
					aria-label="CSV importieren"
					title="Verträge aus CSV importieren"
				>
					<Icon name="upload" size={15} />
					<span class="btn-text">Import</span>
				</a>
			</div>

			<!-- Neuer Vertrag Button -->
			<a
				href="/dashboard/contracts/new"
				class="btn btn-primary"
				aria-label="Neuer Vertrag"
			>
				<Icon name="plus" size={15} />
				<span class="btn-text">Neuer Vertrag</span>
			</a>

			<!-- User-Dropdown -->
			<div class="user-dropdown">
				<button
					onclick={() => (showUserMenu = !showUserMenu)}
					class="user-button"
					aria-label="Benutzermenü"
					aria-haspopup="true"
					aria-expanded={showUserMenu}
				>
					<span class="user-avatar"><Icon name="user" size={16} /></span>
					<!-- Email (nur Desktop) -->
					<span class="user-email">{userEmail}</span>
					<Icon
						name="chevron"
						size={14}
						class="dropdown-icon {showUserMenu ? 'dropdown-icon-open' : ''}"
					/>
				</button>

				<!-- Dropdown-Menü -->
				{#if showUserMenu}
					<div class="dropdown-menu">
						<!-- User-Info -->
						<div class="dropdown-header">
							<div class="dropdown-avatar">
								{userEmail.charAt(0).toUpperCase()}
							</div>
							<div class="dropdown-user-info">
								<p class="dropdown-email">{userEmail}</p>
								<p class="dropdown-status">Angemeldet</p>
							</div>
						</div>

						<div class="dropdown-divider"></div>

						<!-- CSV-Aktionen: nur hier erreichbar, wenn der Header sie ausblendet -->
						<div class="dropdown-csv">
							<button
								onclick={() => {
									showUserMenu = false;
									handleExport();
								}}
								disabled={isExporting}
								class="dropdown-item"
							>
								<Icon name="download" />
								<span
									>{isExporting
										? "Exportiere …"
										: "Als CSV exportieren"}</span
								>
							</button>

							<a
								href="/dashboard/import"
								class="dropdown-item"
								onclick={() => (showUserMenu = false)}
							>
								<Icon name="upload" />
								<span>CSV importieren</span>
							</a>

							<div class="dropdown-divider"></div>
						</div>

						<!-- Menü-Items -->
						<a
							href="/dashboard/profile"
							class="dropdown-item"
							onclick={() => (showUserMenu = false)}
						>
							<Icon name="user" />
							<span>Mein Profil</span>
						</a>

						<div class="dropdown-divider"></div>

						<button
							onclick={handleLogoutClick}
							class="dropdown-item dropdown-item-danger"
						>
							<Icon name="logout" />
							<span>Abmelden</span>
						</button>
					</div>
				{/if}
			</div>
		</nav>
	</div>
</header>

<!-- Logout-Bestätigung Modal -->
{#if showLogoutConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-overlay"
		onclick={cancelLogout}
		role="dialog"
		aria-modal="true"
		aria-labelledby="logout-modal-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Modal-Header -->
			<div class="modal-header">
				<div class="modal-icon"><Icon name="logout" size={24} /></div>
				<h3 id="logout-modal-title" class="modal-title">
					Wirklich abmelden?
				</h3>
				<p class="modal-description">
					Du wirst zur Startseite weitergeleitet und musst dich erneut
					anmelden, um deine Verträge zu verwalten.
				</p>
			</div>

			<!-- Modal-Actions -->
			<div class="modal-actions">
				<form method="POST" action="/auth/logout">
					<button type="submit" class="btn btn-danger modal-btn">
						<Icon name="check" />
						Ja, abmelden
					</button>
				</form>
				<button onclick={cancelLogout} class="btn modal-btn">
					<Icon name="x" />
					Abbrechen
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Main Content Area -->
<main id="main" tabindex="-1" class="main-content">
	{@render children()}
</main>

<style>
	/* ===== HEADER ===== */
	.dashboard-header {
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-line-strong);
		position: sticky;
		top: 0;
		z-index: 40;
	}

	/* Gleiche Maximalbreite wie der Seiteninhalt, damit beides fluchtet */
	.header-container {
		max-width: 70rem;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 3.75rem;
	}

	/* Logo */
	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		color: inherit;
		text-decoration: none;
	}

	.logo-icon {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-card);
		background: var(--color-accent);
		color: var(--color-surface);
		flex-shrink: 0;
	}

	.logo-title {
		font-size: 18px;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin: 0;
	}

	.logo-subtitle {
		font-size: 12px;
		color: var(--color-ink-3);
		line-height: 1;
		margin: 0;
	}

	/* Navigation */
	.nav-section {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.csv-actions {
		display: flex;
		gap: 0.375rem;
		padding-right: 0.5rem;
		margin-right: 0.125rem;
		border-right: 1px solid var(--color-line);
	}

	/* Export-Spinner: einziges Lade-Feedback, von reduced-motion ausgenommen */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* User-Dropdown */
	.user-dropdown {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		border: 1px solid transparent;
		border-radius: var(--radius-card);
		background: transparent;
		color: var(--color-ink-2);
		font-size: 13.5px;
		cursor: pointer;
	}

	.user-button:hover {
		border-color: var(--color-line-strong);
	}

	.user-avatar {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: var(--color-line-strong);
		color: var(--color-ink-2);
		flex-shrink: 0;
	}

	.user-email {
		max-width: 150px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Icon rendert ein eigenes Element, daher :global für die übergebene Klasse */
	.user-button :global(.dropdown-icon) {
		color: var(--color-ink-3);
		flex-shrink: 0;
		transition: transform 0.2s;
	}

	.user-button :global(.dropdown-icon-open) {
		transform: rotate(180deg);
	}

	/* Dropdown-Menü */
	.dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		width: 16rem;
		background: var(--color-surface);
		border: 1px solid var(--color-line-strong);
		border-radius: var(--radius-card);
		box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.12);
		overflow: hidden;
		animation: dropdown-fade-in 0.15s ease;
		z-index: 50;
	}

	@keyframes dropdown-fade-in {
		from {
			opacity: 0;
		}
	}

	.dropdown-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
	}

	.dropdown-avatar {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		background: var(--color-accent);
		color: var(--color-surface);
		font-weight: 600;
		flex-shrink: 0;
	}

	.dropdown-user-info {
		flex: 1;
		min-width: 0;
	}

	.dropdown-email {
		font-size: 13.5px;
		font-weight: 600;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown-status {
		font-size: 12px;
		color: var(--color-ok);
		margin: 0;
	}

	.dropdown-divider {
		height: 1px;
		background: var(--color-line);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		color: var(--color-ink-2);
		font-size: 13.5px;
		font-weight: 500;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.dropdown-item:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	.dropdown-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dropdown-item-danger:hover {
		color: var(--color-crit);
	}

	/* CSV im Dropdown nur, solange der Header die Buttons nicht zeigt */
	.dropdown-csv {
		display: none;
	}

	/* ===== MODAL ===== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
		padding: 1rem;
		animation: dropdown-fade-in 0.15s ease;
	}

	.modal-content {
		width: 100%;
		max-width: 26rem;
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-line-strong);
		border-radius: var(--radius-card);
	}

	.modal-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.modal-icon {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		margin: 0 auto 1rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-crit) 8%, transparent);
		color: var(--color-crit);
	}

	.modal-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.modal-description {
		font-size: 14px;
		color: var(--color-ink-2);
		line-height: 1.5;
		margin: 0;
	}

	.modal-actions {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.modal-btn {
		width: 100%;
		justify-content: center;
		padding: 0.75rem 1rem;
	}

	/* ===== MAIN CONTENT ===== */
	/* Höhe kommt aus der Spalte im Root-Layout, sonst rutscht der Footer unter den Fensterrand */
	.main-content {
		flex: 1;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		/* Kein Platz im Header – die Aktionen wandern ins User-Dropdown */
		.csv-actions {
			display: none;
		}

		.dropdown-csv {
			display: block;
		}
	}

	@media (max-width: 640px) {
		.header-container {
			padding: 0 1rem;
		}

		.logo-subtitle {
			display: none;
		}

		.btn-text {
			display: none;
		}

		.user-email {
			display: none;
		}

		.dropdown-menu {
			width: calc(100vw - 2rem);
			right: -0.5rem;
		}
	}
</style>
