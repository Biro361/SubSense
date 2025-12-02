<script>
    import { contracts } from '$lib/stores/contracts.js';

    // FIX 1: $state macht die Variable reaktiv für die UI
    let showModal = $state(false);

    // FIX 2: Auch das Objekt muss reaktiv sein, damit die Inputs funktionieren
    let newContract = $state({
        name: '',
        cost: 0,
        cycle: 'monatlich',
        nextDueDate: '',
        cancellationNotice: 30,
        category: 'Sonstiges'
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
    };

    const addContract = () => {
        // Validierung
        if (!newContract.name || !newContract.cost) return;

        contracts.update(current => [
            ...current, 
            // WICHTIG: Hier Snapshot der Daten nehmen, da es ein Proxy ist
            { ...newContract, id: Date.now() } 
        ]);

        showModal = false;
        
        // Reset (Direkte Zuweisung funktioniert dank $state)
        newContract = { 
            name: '', 
            cost: 0, 
            cycle: 'monatlich', 
            nextDueDate: '', 
            cancellationNotice: 30, // Fehlte im Reset beim Original
            category: 'Sonstiges' 
        };
    };
</script>

<div class="p-8 max-w-4xl mx-auto">
    <header class="mb-8 flex justify-between items-end">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">SubSense Dashboard</h1>
            <p class="text-gray-600">Deine Abos im Überblick</p>
        </div>
        <!-- 
           FIX 3: In Svelte 5 nutzt man 'onclick' (ohne Doppelpunkt) statt 'on:click'.
           (on:click würde zwar noch gehen, aber onclick ist der neue Standard)
        -->
        <button 
            onclick={() => showModal = true}
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
            + Abo hinzufügen
        </button>
    </header>

    <!-- ... Dein Grid Code bleibt gleich ... -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each $contracts as contract}
             <!-- ... Karten Code ... -->
             <!-- Tipp: Damit formatCurrency im Template geht, ist das ok. -->
             <div class="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <!-- ... Inhalt ... -->
                 <p class="flex justify-between">
                    <span>Kosten:</span>
                    <span class="font-medium">{formatCurrency(contract.cost)} / {contract.cycle === 'monatlich' ? 'Mt.' : 'Jr.'}</span>
                  </p>
                 <!-- ... -->
             </div>
        {/each}
    </div>
</div>

<!-- MODAL -->
{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Neues Abo erfassen</h2>
            
            <!-- Inputs bleiben gleich, bind:value funktioniert mit $state Objekten -->
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" bind:value={newContract.name} class="mt-1 block w-full border border-gray-300 rounded p-2" placeholder="z.B. Netflix">
                </div>
                <!-- ... Restliche Inputs ... -->
            </div>

            <div class="mt-6 flex justify-end space-x-3">
                <!-- FIX 4: Auch hier onclick verwenden -->
                <button onclick={() => showModal = false} class="text-gray-500 hover:text-gray-700 px-4 py-2">Abbrechen</button>
                <button onclick={addContract} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Speichern</button>
            </div>
        </div>
    </div>
{/if}
