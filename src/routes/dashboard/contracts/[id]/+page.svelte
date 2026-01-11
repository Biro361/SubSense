<!-- src/routes/dashboard/contracts/[id]/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { getCategoryByValue } from '$lib/constants';
  
  let { data, form } = $props();
  let contract = $derived(data.contract);
  
  // Tab-State
  let activeTab = $state('details');
  
  // Edit-States
  let notesText = $state(contract.notes || '');
  let instructionsText = $state(contract.cancellationInstructions || '');
  let cancellationUrl = $state(contract.cancellationUrl || '');
  
  // Status-Badge-Farbe
  const statusColor = $derived(
    contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  );
  
  // Kategorie-Info
  const category = $derived(getCategoryByValue(contract.category));
  
  // Datum formatieren
  function formatDate(dateString) {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
  
  // Dateigrösse formatieren
  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  // Datei-Icon basierend auf MIME-Type
  function getFileIcon(mimeType) {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType?.includes('word')) return '📝';
    return '📎';
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{contract.name}</h1>
        <p class="text-gray-600 mt-1">{contract.provider}</p>
      </div>
      <div class="flex gap-2 items-center">
        {#if category}
          <span class="px-3 py-1 rounded-full text-sm font-medium bg-{category.color}-100 text-{category.color}-800">
            {category.icon} {category.label}
          </span>
        {/if}
        <span class="px-3 py-1 rounded-full text-sm font-medium {statusColor}">
          {contract.status === 'active' ? 'Aktiv' : 'Gekündigt'}
        </span>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="mt-4 flex gap-3">
      <a 
        href="/dashboard/contracts/{contract._id}/edit" 
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        ✏️ Bearbeiten
      </a>
      <a 
        href="/dashboard" 
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      >
        ← Zurück zum Dashboard
      </a>
    </div>
  </div>
  
  <!-- Feedback-Meldung -->
  {#if form?.success}
    <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
      ✓ {form.message}
    </div>
  {:else if form?.success === false}
    <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
      ✗ {form.message}
    </div>
  {/if}
  
  <!-- Tabs -->
  <div class="border-b border-gray-200 mb-6">
    <nav class="flex gap-4">
      <button
        onclick={() => activeTab = 'details'}
        class="pb-3 px-1 border-b-2 font-medium transition-colors {activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        📋 Details
      </button>
      <button
        onclick={() => activeTab = 'notes'}
        class="pb-3 px-1 border-b-2 font-medium transition-colors {activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        📝 Notizen
      </button>
      <button
        onclick={() => activeTab = 'instructions'}
        class="pb-3 px-1 border-b-2 font-medium transition-colors {activeTab === 'instructions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        📖 Kündigungsanweisungen
      </button>
      <button
        onclick={() => activeTab = 'documents'}
        class="pb-3 px-1 border-b-2 font-medium transition-colors {activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
      >
        📎 Dokumente ({contract.documents?.length || 0})
      </button>
    </nav>
  </div>
  
  <!-- Tab-Content -->
  <div class="bg-white rounded-lg shadow p-6">
    
    <!-- Details Tab -->
    {#if activeTab === 'details'}
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Kündigungsdatum</h3>
            <p class="mt-1 text-lg font-semibold text-gray-900">
              {formatDate(contract.cancellationDate)}
            </p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Tage bis zur Kündigung</h3>
            <p class="mt-1 text-lg font-semibold {contract.isOverdue ? 'text-red-600' : contract.isUrgent ? 'text-orange-600' : 'text-green-600'}">
              {#if contract.isOverdue}
                ⚠️ Überfällig ({Math.abs(contract.daysUntilCancellation)} Tage)
              {:else if contract.daysUntilCancellation === 0}
                🔥 Heute!
              {:else if contract.daysUntilCancellation === 1}
                ⏰ Morgen
              {:else}
                📅 Noch {contract.daysUntilCancellation} Tage
              {/if}
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Kosten</h3>
            <p class="mt-1 text-lg font-semibold text-gray-900">
              {contract.cost?.toFixed(2) || '0.00'} CHF / {contract.billingCycle === 'monthly' ? 'Monat' : contract.billingCycle === 'yearly' ? 'Jahr' : 'Quartal'}
            </p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Erinnerung</h3>
            <p class="mt-1 text-gray-900">
              {contract.reminderDays} Tage vorher ({formatDate(contract.reminderDate)})
            </p>
          </div>
        </div>
        
        {#if contract.cancellationUrl}
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Kündigungsseite</h3>
            <a 
              href={contract.cancellationUrl} 
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {contract.cancellationUrl}
            </a>
          </div>
        {/if}
        
        <div class="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Erstellt am</h3>
            <p class="mt-1 text-gray-900">{formatDate(contract.createdAt)}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Zuletzt aktualisiert</h3>
            <p class="mt-1 text-gray-900">{formatDate(contract.updatedAt)}</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Notizen Tab -->
    {#if activeTab === 'notes'}
      <form method="POST" action="?/updateNote" use:enhance>
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
            Persönliche Notizen
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="10"
            bind:value={notesText}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Hier kannst du Notizen zu diesem Vertrag speichern...\n\nBeispielsweise:\n- Testphase endet am 15. Februar\n- Kündigung per E-Mail an kuendigung@anbieter.ch\n- Kundennummer: 12345"
          ></textarea>
          <p class="text-xs text-gray-500 mt-2">
            💡 Tipp: Notiere wichtige Details wie Kundennummern, Kontaktdaten oder Kündigungshinweise.
          </p>
        </div>
        
        <button
          type="submit"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💾 Speichern
        </button>
      </form>
    {/if}
    
    <!-- Kündigungsanweisungen Tab -->
    {#if activeTab === 'instructions'}
      <form method="POST" action="?/updateInstructions" use:enhance>
        <div class="space-y-4">
          <div>
            <label for="cancellationUrl" class="block text-sm font-medium text-gray-700 mb-2">
              Link zur Kündigungsseite
            </label>
            <input
              type="url"
              id="cancellationUrl"
              name="cancellationUrl"
              bind:value={cancellationUrl}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.anbieter.ch/kuendigung"
            />
          </div>
          
          <div>
            <label for="instructions" class="block text-sm font-medium text-gray-700 mb-2">
              Kündigungsanweisungen
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows="10"
              bind:value={instructionsText}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Schritt-für-Schritt Anleitung zur Kündigung...\n\n1. Auf der Webseite einloggen\n2. Menü 'Mein Konto' öffnen\n3. Unter 'Verträge' die Option 'Kündigen' wählen\n4. Kündigungsbestätigung per E-Mail abwarten"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              💡 Tipp: Halte die Schritte fest, damit du beim nächsten Mal schnell weisst, wie die Kündigung funktioniert.
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💾 Speichern
        </button>
      </form>
    {/if}
    
    <!-- Dokumente Tab -->
    {#if activeTab === 'documents'}
      <div class="space-y-6">
        <!-- Upload-Formular -->
        <form method="POST" action="?/uploadDocument" enctype="multipart/form-data" use:enhance>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              name="document"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              class="hidden"
              id="file-upload"
            />
            <label for="file-upload" class="cursor-pointer">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span class="mt-2 block text-sm font-medium text-gray-900">
                📎 Dokument hochladen
              </span>
              <span class="mt-1 block text-xs text-gray-500">
                PDF, Word, JPG, PNG, WebP (max. 5 MB)
              </span>
            </label>
          </div>
          
          <button
            type="submit"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ⬆️ Hochladen
          </button>
        </form>
        
        <!-- Dokumentenliste -->
        {#if contract.documents && contract.documents.length > 0}
          <div class="mt-6">
            <h3 class="text-sm font-medium text-gray-700 mb-3">Gespeicherte Dokumente</h3>
            <ul class="divide-y divide-gray-200 border border-gray-200 rounded-lg">
              {#each contract.documents as doc}
                <li class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                      <span class="text-3xl">{getFileIcon(doc.mimeType)}</span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{doc.originalName}</p>
                        <p class="text-xs text-gray-500">
                          {formatFileSize(doc.size)} • {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div class="flex gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        👁️ Öffnen
                      </a>
                      <form method="POST" action="?/deleteDocument" use:enhance class="inline">
                        <input type="hidden" name="documentId" value={doc._id} />
                        <input type="hidden" name="filename" value={doc.filename} />
                        <button
                          type="submit"
                          class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          onclick="return confirm('Dokument wirklich löschen?')"
                        >
                          🗑️ Löschen
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="text-center py-8 bg-gray-50 rounded-lg">
            <p class="text-gray-500">📭 Noch keine Dokumente hochgeladen</p>
            <p class="text-sm text-gray-400 mt-1">
              Lade Vertragsdokumente, Kündigungsbestätigungen oder andere wichtige Dateien hoch.
            </p>
          </div>
        {/if}
      </div>
    {/if}
    
  </div>
</div>