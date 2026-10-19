<script>
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let contract = $derived(data.contract);
</script>

<div class="mx-auto max-w-[70rem] px-6 pt-10 pb-16 max-sm:px-4 max-sm:pt-7">
  <div class="max-w-2xl">
    <h1 class="mb-4 text-3xl font-semibold tracking-tight">Vertrag löschen</h1>

    {#if form?.error}
      <div role="alert" class="mb-6 rounded-card border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">
        {form.error}
      </div>
    {/if}

    <p class="mb-6 text-ink-2">
      Möchtest du den folgenden Vertrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
    </p>

    <div class="mb-6 border-l-[3px] border-crit bg-surface py-3 pr-4 pl-4">
      <p class="font-semibold [overflow-wrap:anywhere]">{contract.name}</p>
      <p class="text-sm text-ink-2">{contract.provider}</p>
    </div>

    <form method="POST" use:enhance class="flex gap-2">
      <button type="submit" class="btn btn-danger">
        Ja, löschen
      </button>
      <a href="/" class="btn">
        Abbrechen
      </a>
    </form>
  </div>
</div>
