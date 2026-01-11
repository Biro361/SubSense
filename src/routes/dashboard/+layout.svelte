<!-- src/routes/dashboard/+layout.svelte -->
<script>
	let { data, children } = $props();
	
	// User-Dropdown State
	let showUserMenu = $state(false);
	
	// Logout-Bestätigung State
	let showLogoutConfirm = $state(false);
	
	// User-Email extrahieren
	let userEmail = $derived(data.user?.email || 'Nutzer');
	
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
		if (showUserMenu && !target.closest('.user-dropdown')) {
			showUserMenu = false;
		}
	}
	
	// Keyboard-Handler für Modal (Escape-Taste)
	function handleKeydown(event) {
		if (event.key === 'Escape' && showLogoutConfirm) {
			cancelLogout();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<!-- Fixed Header -->
<header class="dashboard-header">
	<div class="header-container">
		<div class="header-content">
			<!-- Logo/Titel -->
			<a href="/dashboard" class="logo-link">
				<div class="logo-icon">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div>
					<h1 class="logo-title">SubSense</h1>
					<p class="logo-subtitle">Vertrags-Radar</p>
				</div>
			</a>
			
			<!-- Navigation -->
			<nav class="nav-section">
				<!-- Neuer Vertrag Button -->
				<a href="/dashboard/contracts/new" class="btn-new-contract">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					<span class="btn-text">Neuer Vertrag</span>
					<span class="btn-text-mobile">+</span>
				</a>
				
				<!-- User-Dropdown -->
				<div class="user-dropdown">
					<button
						onclick={() => showUserMenu = !showUserMenu}
						class="user-button"
						aria-label="Benutzermenü"
						aria-expanded={showUserMenu}
					>
						<!-- User-Avatar -->
						<div class="user-avatar">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<!-- Email (nur Desktop) -->
						<span class="user-email">{userEmail}</span>
						<!-- Dropdown-Icon -->
						<svg 
							xmlns="http://www.w3.org/2000/svg" 
							class="dropdown-icon {showUserMenu ? 'dropdown-icon-open' : ''}"
							fill="none" 
							viewBox="0 0 24 24" 
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
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
							
							<!-- Menü-Items -->
							<a
								href="/dashboard/profile"
								class="dropdown-item"
								onclick={() => showUserMenu = false}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span>Mein Profil</span>
							</a>
							
							<div class="dropdown-divider"></div>
							
							<button
								onclick={handleLogoutClick}
								class="dropdown-item dropdown-item-danger"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span>Abmelden</span>
							</button>
						</div>
					{/if}
				</div>
			</nav>
		</div>
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
	>
		<!-- svelte-ignore a11y_click_events_have_key_keys -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
			<!-- Modal-Header -->
			<div class="modal-header">
				<div class="modal-icon">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</div>
				<h3 id="logout-modal-title" class="modal-title">Wirklich abmelden?</h3>
				<p class="modal-description">
					Du wirst zur Startseite weitergeleitet und musst dich erneut anmelden, um deine Verträge zu verwalten.
				</p>
			</div>
			
			<!-- Modal-Actions -->
			<div class="modal-actions">
				<a href="/auth/logout" class="btn-modal btn-modal-danger">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Ja, abmelden
				</a>
				<button onclick={cancelLogout} class="btn-modal btn-modal-secondary">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Abbrechen
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Main Content Area -->
<main class="main-content">
	{@render children()}
</main>

<style>
	/* ===== HEADER ===== */
	.dashboard-header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 40;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}
	
	.header-container {
		max-width: 80rem;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 4rem;
	}
	
	/* Logo */
	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: opacity 0.2s;
	}
	
	.logo-link:hover {
		opacity: 0.8;
	}
	
	.logo-icon {
		width: 2.5rem;
		height: 2.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}
	
	.logo-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		line-height: 1.2;
		margin: 0;
	}
	
	.logo-subtitle {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
		line-height: 1;
	}
	
	/* Navigation */
	.nav-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	/* Neuer Vertrag Button */
	.btn-new-contract {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		padding: 0.625rem 1.25rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
	}
	
	.btn-new-contract:hover {
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
		transform: translateY(-1px);
	}
	
	.btn-text-mobile {
		display: none;
	}
	
	/* User-Dropdown */
	.user-dropdown {
		position: relative;
	}
	
	.user-button {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		background: #f3f4f6;
		padding: 0.5rem 0.875rem;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}
	
	.user-button:hover {
		background: #e5e7eb;
		border-color: #d1d5db;
	}
	
	.user-avatar {
		width: 2rem;
		height: 2rem;
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}
	
	.user-email {
		color: #374151;
		font-weight: 500;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.dropdown-icon {
		width: 1rem;
		height: 1rem;
		color: #6b7280;
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	
	.dropdown-icon-open {
		transform: rotate(180deg);
	}
	
	/* Dropdown-Menü */
	.dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		width: 16rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 1px solid #e5e7eb;
		overflow: hidden;
		animation: dropdown-fade-in 0.2s ease;
		z-index: 50;
	}
	
	@keyframes dropdown-fade-in {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.dropdown-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	}
	
	.dropdown-avatar {
		width: 2.5rem;
		height: 2.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 700;
		font-size: 1.125rem;
		flex-shrink: 0;
	}
	
	.dropdown-user-info {
		flex: 1;
		min-width: 0;
	}
	
	.dropdown-email {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.dropdown-status {
		font-size: 0.75rem;
		color: #059669;
		margin: 0;
	}
	
	.dropdown-divider {
		height: 1px;
		background: #e5e7eb;
	}
	
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.875rem 1rem;
		border: none;
		background: white;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		text-decoration: none;
	}
	
	.dropdown-item:hover {
		background: #f9fafb;
	}
	
	.dropdown-item-danger:hover {
		background: #fef2f2;
		color: #dc2626;
	}
	
	/* ===== MODAL ===== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
		padding: 1rem;
		animation: modal-fade-in 0.2s ease;
	}
	
	@keyframes modal-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 26rem;
		width: 100%;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		animation: modal-scale-in 0.2s ease;
	}
	
	@keyframes modal-scale-in {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	.modal-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.modal-icon {
		width: 4rem;
		height: 4rem;
		background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
		color: #dc2626;
	}
	
	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}
	
	.modal-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}
	
	.modal-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.btn-modal {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.25rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
	}
	
	.btn-modal-danger {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
	}
	
	.btn-modal-danger:hover {
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
		transform: translateY(-1px);
	}
	
	.btn-modal-secondary {
		background: white;
		color: #374151;
		border: 2px solid #e5e7eb;
	}
	
	.btn-modal-secondary:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}
	
	/* ===== MAIN CONTENT ===== */
	.main-content {
		min-height: calc(100vh - 4rem);
	}
	
	/* ===== RESPONSIVE ===== */
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
		
		.btn-text-mobile {
			display: block;
			font-size: 1.25rem;
			font-weight: 600;
		}
		
		.btn-new-contract {
			padding: 0.625rem 1rem;
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
