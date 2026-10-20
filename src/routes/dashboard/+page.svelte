<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { page } from "$app/stores";
  import { onMount, tick } from "svelte";
  import { replaceState } from "$app/navigation";
  import { CATEGORIES, formatAmount, getCategoryByValue, monthlyCost } from "$lib/constants";
  import { compareByDeadline } from "$lib/reminders.js";
  import Toast from "$lib/components/Toast.svelte";
  import Icon from "$lib/components/Icon.svelte";

  let { data } = $props();
  let contracts = $derived(data.contracts || []);

  let message = $derived($page.url.searchParams.get("message"));
  let importCount = $derived($page.url.searchParams.get("count"));

  let successMessage = $derived(
    message === "created"
      ? "Vertrag erfolgreich erstellt!"
      : message === "updated"
        ? "Vertrag erfolgreich aktualisiert!"
        : message === "deleted"
          ? "Vertrag erfolgreich gelöscht!"
          : message === "import_success"
            ? `${importCount ?? "0"} Verträge erfolgreich importiert!`
            : null,
  );

  // Filter-State
  let selectedCategory = $state("all");
  // Suchfilter-State
  let searchQuery = $state("");

  // Gefilterte Verträge (kombiniert Kategorie + Suche)
  let filteredContracts = $derived.by(() => {
    // 1. Kategorie-Filter anwenden
    let result = selectedCategory === "all"
      ? contracts
      : contracts.filter((c) => c.category === selectedCategory);

    // 2. Suchfilter anwenden (nur wenn searchQuery nicht leer)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter((contract) => {
        // Suche in: Name, Anbieter, Status
        const nameMatch = contract.name?.toLowerCase().includes(query);
        const providerMatch = contract.provider?.toLowerCase().includes(query);
        const statusMatch = (contract.status === "active" ? "aktiv" : "gekündigt").includes(query);

        return nameMatch || providerMatch || statusMatch;
      });
    }

    return result;
  });

  // Toast-State
  let showToast = $state(false);
  let toastMessage = $state("");

  // Toast anzeigen; die Komponente blendet sich nach 5 Sekunden selbst aus
  onMount(async () => {
    if (successMessage) {
      toastMessage = successMessage;
      showToast = true;

      // URL bereinigen (ohne ?message=...)
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      url.searchParams.delete("count");
      // Erst nach tick(): beim ersten Laden ist der Router in onMount noch nicht bereit
      await tick();
      replaceState(url, {});
    }
  });

  // Überfällige und dringende zuerst, dann nach Frist
  let sortedContracts = $derived([...filteredContracts].sort(compareByDeadline));

  // Dringende Verträge filtern
  let urgentContracts = $derived(contracts.filter((c) => c.isUrgent));

  // Überfällige Verträge filtern (höchste Priorität)
  let overdueContracts = $derived(contracts.filter((c) => c.isOverdue));

  // Kostenberechnungen - nur aktive Verträge
  let activeContracts = $derived(
    contracts.filter((c) => c.status === "active"),
  );

  // Monatliche Gesamtkosten (normalisiert)
  let totalMonthlyCost = $derived(
    activeContracts.reduce((sum, contract) => sum + monthlyCost(contract), 0),
  );

  // Jährliche Gesamtkosten
  let totalYearlyCost = $derived(totalMonthlyCost * 12);

  // Abrechnungszyklus formatieren
  function formatBillingCycle(cycle) {
    switch (cycle) {
      case "monthly":
        return "Monat";
      case "yearly":
        return "Jahr";
      case "quarterly":
        return "Quartal";
      default:
        return "Monat";
    }
  }

  // Tage-Text formatieren
  function formatDaysText(days) {
    if (days === 0) return "Heute";
    if (days === 1) return "Morgen";
    if (days < 0) return `Überfällig (${Math.abs(days)} Tage)`;
    return `Noch ${days} Tage`;
  }

  // Datum zweistellig, damit die Fristen-Spalte fluchtet
  function formatDate(date) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Statistiken pro Kategorie
  let categoryStats = $derived(
    CATEGORIES.map((cat) => {
      const categoryContracts = contracts.filter(
        (c) => c.category === cat.value,
      );
      const count = categoryContracts.length;
      const categoryMonthlyCost = categoryContracts
        .filter((c) => c.status === "active")
        .reduce((sum, c) => sum + monthlyCost(c), 0);

      return {
        ...cat,
        count,
        monthlyCost: categoryMonthlyCost,
      };
    }),
  );

  // Vertrag mit der nächsten Frist (überfällig schlägt dringend)
  let nextDeadline = $derived(
    overdueContracts[0] ?? urgentContracts[0] ?? null,
  );

  // Teuerste Kategorie, für die Kennzahl neben der Leitzahl
  let topCategory = $derived(
    [...categoryStats].sort(
      (a, b) => b.monthlyCost - a.monthlyCost,
    )[0] ?? null,
  );

  // Aktive Verträge, deren Frist in den nächsten 30 Tagen liegt
  let deadlinesSoon = $derived(
    activeContracts.filter(
      (c) => c.daysUntilCancellation >= 0 && c.daysUntilCancellation <= 30,
    ),
  );
</script>

<svelte:head>
  <title>Dashboard – SubSense</title>
</svelte:head>

{#if showToast}
  <Toast message={toastMessage} onClose={() => (showToast = false)} />
{/if}

<div class="page">
  {#if contracts.length === 0}
    <div class="empty">
      <p>Noch keine Verträge vorhanden.</p>
      <a href="/dashboard/contracts/new" class="btn btn-primary">
        <Icon name="plus" size={15} />
        Ersten Vertrag erstellen
      </a>
    </div>
  {:else}
    <!-- Leitzahl: die eine Information, die zählt -->
    <section class="lead">
      <p class="kicker">Laufende Kosten</p>
      <p class="figure">
        {formatAmount(totalMonthlyCost)} <i>CHF / Monat</i>
      </p>
      <p class="sub">
        <b
          >{activeContracts.length}
          {activeContracts.length === 1 ? "aktiver Vertrag" : "aktive Verträge"}</b
        >
        · {formatAmount(totalYearlyCost)} CHF im Jahr
        {#if overdueContracts.length > 0}
          · <b class="text-crit"
            >{overdueContracts.length}
            {overdueContracts.length === 1 ? "Frist" : "Fristen"} verpasst</b
          >
        {/if}
        {#if urgentContracts.length > 0}
          · {urgentContracts.length}
          {urgentContracts.length === 1 ? "Frist läuft" : "Fristen laufen"} bald
          ab
        {/if}
      </p>
    </section>

    <!-- Nächste Frist, dann Kennzahlen -->
    <section class="tiles" aria-label="Übersicht">
      {#if nextDeadline}
        <article class="tile tile-hero" class:is-crit={nextDeadline.isOverdue}>
          <p class="hero-top">
            <Icon name="alert" size={15} />
            {nextDeadline.isOverdue ? "Frist verpasst" : "Nächste Frist"}
          </p>
          <p class="hero-name">{nextDeadline.name}</p>
          <p class="hero-count">
            {formatDaysText(nextDeadline.daysUntilCancellation)}
            <small>
              {nextDeadline.isOverdue ? "Frist war am" : "Kündigung möglich bis"}
              {formatDate(nextDeadline.cancellationDate)}
            </small>
          </p>
          <div class="hero-foot">
            {#if nextDeadline.cancellationUrl}
              <a
                class="btn btn-primary"
                href={nextDeadline.cancellationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="external" size={15} />
                Zur Kündigungsseite
              </a>
            {/if}
            <a class="btn" href="/dashboard/contracts/{nextDeadline._id}/edit">
              Status aktualisieren
            </a>
          </div>
        </article>
      {/if}

      <article class="tile">
        <p class="tile-label">Teuerste Kategorie</p>
        {#if topCategory && topCategory.monthlyCost > 0}
          <p class="tile-value">{formatAmount(topCategory.monthlyCost)} <i>CHF</i></p>
          <p class="tile-note">
            {topCategory.label} · {Math.round(
              (topCategory.monthlyCost / totalMonthlyCost) * 100,
            )} % der Monatskosten
          </p>
        {:else}
          <p class="tile-value">–</p>
        {/if}
      </article>

      <article class="tile">
        <p class="tile-label">Fristen in 30 Tagen</p>
        <p class="tile-value">{deadlinesSoon.length}</p>
        {#if deadlinesSoon.length > 0}
          <p class="tile-note">{deadlinesSoon.map((c) => c.name).join(", ")}</p>
        {/if}
      </article>

      <article class="tile">
        <p class="tile-label">Gekündigt</p>
        <p class="tile-value">{contracts.length - activeContracts.length}</p>
        <p class="tile-note">von {contracts.length} Verträgen</p>
      </article>
    </section>

    <!-- Werkzeuge: leise, weil sie nicht der Inhalt sind -->
    <div class="tools">
      <div class="search">
        <Icon name="search" size={15} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          aria-label="Verträge durchsuchen"
          placeholder="Name, Anbieter oder Status"
        />
        {#if searchQuery.trim() !== ""}
          <button
            onclick={() => (searchQuery = "")}
            class="icon-btn search-clear"
            aria-label="Suche löschen"
          >
            <Icon name="x" size={15} />
          </button>
        {/if}
      </div>

      <div class="chips" role="group" aria-label="Nach Kategorie filtern">
        <button
          type="button"
          class="chip"
          aria-pressed={selectedCategory === "all"}
          onclick={() => (selectedCategory = "all")}
        >
          Alle <b>{contracts.length}</b>
        </button>
        {#each categoryStats as cat}
          {#if cat.count > 0}
            <button
              type="button"
              class="chip"
              aria-pressed={selectedCategory === cat.value}
              onclick={() => (selectedCategory = cat.value)}
            >
              {cat.label} <b>{cat.count}</b>
            </button>
          {/if}
        {/each}
      </div>
    </div>

    <div class="list-head">
      <h2>
        {searchQuery.trim() !== "" || selectedCategory !== "all"
          ? "Gefilterte Verträge"
          : "Alle Verträge"}
      </h2>
      <span class="count">nach Frist sortiert · {sortedContracts.length}</span>
    </div>

    {#if sortedContracts.length === 0}
      <div class="empty">
        <p>
          Keine Treffer{searchQuery.trim() !== ""
            ? ` für „${searchQuery.trim()}“`
            : " in dieser Kategorie"}.
        </p>
        <button
          type="button"
          class="btn"
          onclick={() => {
            searchQuery = "";
            selectedCategory = "all";
          }}
        >
          Filter zurücksetzen
        </button>
      </div>
    {:else}
      <ul class="rows">
        {#each sortedContracts as contract (contract._id)}
          {@const cat = getCategoryByValue(contract.category)}
          {@const active = contract.status === "active"}
          <li
            class="row"
            class:row-crit={contract.isOverdue}
            class:row-warn={contract.isUrgent}
            class:row-done={!active}
          >
            <div class="name">
              <!-- Titel-Link deckt die ganze Zeile ab -->
              <a href="/dashboard/contracts/{contract._id}" class="row-link"
                >{contract.name}</a
              >
              {#if cat}<span class="cat">{cat.label}</span>{/if}
            </div>

            <div class="meta">
              <span>{contract.provider}</span>
              <span class="sep" aria-hidden="true">·</span>
              <span>
                {#if !active}
                  Gekündigt
                {:else if contract.isOverdue}
                  Frist überschritten – Vertrag läuft evtl. weiter
                {:else if contract.isUrgent}
                  Erinnerung war am {formatDate(contract.reminderDate)}
                {:else}
                  Erinnerung am {formatDate(contract.reminderDate)}
                {/if}
              </span>
            </div>

            <div class="deadline">
              <p class="d-days">
                {active ? formatDaysText(contract.daysUntilCancellation) : "–"}
              </p>
              <p class="d-date">{formatDate(contract.cancellationDate)}</p>
            </div>

            <div class="cost">
              {#if contract.cost && contract.cost > 0}
                <p class="c-amt">{formatAmount(contract.cost)}</p>
                <p class="c-cycle">
                  CHF / {formatBillingCycle(contract.billingCycle)}
                </p>
              {:else}
                <p class="c-amt">–</p>
                <p class="c-cycle">Keine Kosten angegeben</p>
              {/if}
            </div>

            <!-- Liegen über dem Zeilen-Overlay -->
            <div class="acts">
              <a
                href="/dashboard/contracts/{contract._id}"
                class="icon-btn"
                aria-label="Details zu {contract.name}"
              >
                <Icon name="eye" />
              </a>
              <a
                href="/dashboard/contracts/{contract._id}/edit"
                class="icon-btn"
                aria-label="{contract.name} bearbeiten"
              >
                <Icon name="pencil" />
              </a>
              <a
                href="/dashboard/contracts/{contract._id}/delete"
                class="icon-btn icon-btn-danger"
                aria-label="{contract.name} löschen"
              >
                <Icon name="trash" />
              </a>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .page {
    max-width: 70rem;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }

  .text-crit {
    color: var(--color-crit);
  }

  /* === Leitzahl === */
  .lead {
    margin-bottom: 2.25rem;
  }

  .kicker {
    margin-bottom: 0.75rem;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-ink-3);
  }

  .figure {
    font: 600 54px/1.02 var(--font-mono);
    letter-spacing: -0.03em;
  }

  .figure i,
  .tile-value i {
    font-style: normal;
    font-size: 0.5em;
    font-weight: 400;
    color: var(--color-ink-3);
  }

  .sub {
    margin-top: 0.625rem;
    font-size: 14px;
    color: var(--color-ink-2);
  }

  .sub b {
    font-weight: 600;
    color: var(--color-ink);
  }

  .sub b.text-crit {
    color: var(--color-crit);
  }

  /* === Kennzahlen: dünne Zeile statt Karten === */
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-bottom: 2.5rem;
    border-top: 1px solid var(--color-line-strong);
    border-bottom: 1px solid var(--color-line-strong);
  }

  .tile {
    min-width: 0;
    padding: 1rem 1.25rem 1rem 0;
    border-right: 1px solid var(--color-line);
  }

  .tile + .tile:not(.tile-hero + .tile) {
    padding-left: 1.25rem;
  }

  .tile:last-child {
    border-right: 0;
  }

  .tile-label {
    margin-bottom: 0.45rem;
    font-size: 12.5px;
    color: var(--color-ink-2);
  }

  .tile-value {
    font: 600 24px/1.1 var(--font-mono);
    letter-spacing: -0.03em;
  }

  .tile-note {
    margin-top: 0.35rem;
    font-size: 12px;
    color: var(--color-ink-3);
  }

  .tile-hero {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem 0;
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
    --hero-color: var(--color-warn);
  }

  .tile-hero.is-crit {
    --hero-color: var(--color-crit);
  }

  .hero-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--hero-color);
  }

  .hero-name {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }

  .hero-count {
    font: 600 34px/1 var(--font-mono);
    color: var(--hero-color);
  }

  .hero-count small {
    display: block;
    margin-top: 0.3rem;
    font: 500 14px/1.3 var(--font-sans);
    color: var(--color-ink-2);
  }

  .hero-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  /* === Werkzeugleiste === */
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 1.5rem;
  }

  .search {
    position: relative;
    flex: 1 1 260px;
    min-width: 200px;
  }

  .search :global(.search-icon) {
    position: absolute;
    left: 0.7rem;
    top: 0;
    bottom: 0;
    margin: auto 0;
    color: var(--color-ink-3);
    pointer-events: none;
  }

  .search input {
    width: 100%;
    padding: 0.65rem 2.25rem 0.65rem 2.15rem;
    font-size: 14px;
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-card);
  }

  .search input::placeholder {
    color: var(--color-ink-3);
  }

  .search input:focus-visible {
    outline-offset: 1px;
    border-color: var(--color-accent);
  }

  .search-clear {
    position: absolute;
    right: 0.25rem;
    top: 0;
    bottom: 0;
    margin: auto 0;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .chip {
    padding: 0.5rem 0.7rem;
    font-size: 12.5px;
    font-weight: 500;
    line-height: 1;
    color: var(--color-ink-2);
    background: transparent;
    border: 1px solid var(--color-line-strong);
    border-radius: 3px;
    cursor: pointer;
  }

  .chip b {
    margin-left: 0.3rem;
    font-weight: 600;
    color: var(--color-ink-3);
  }

  .chip:hover {
    color: var(--color-ink);
    border-color: var(--color-ink-3);
  }

  .chip[aria-pressed="true"] {
    color: var(--color-page);
    background: var(--color-ink);
    border-color: var(--color-ink);
  }

  .chip[aria-pressed="true"] b {
    color: var(--color-page);
    opacity: 0.6;
  }

  /* === Liste === */
  .list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 0.625rem;
    border-bottom: 1px solid var(--color-line-strong);
  }

  .list-head h2 {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-ink-3);
  }

  .list-head .count {
    font-size: 12px;
    color: var(--color-ink-3);
  }

  .row {
    position: relative;
    display: grid;
    align-items: center;
    gap: 0.25rem 1rem;
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    grid-template-areas:
      "name deadline cost acts"
      "meta deadline cost acts";
    padding: 1.05rem 1rem 1.05rem 0.9rem;
    border-bottom: 1px solid var(--color-line);
    transition: background-color 0.12s;
  }

  /* Dringlichkeit als 3px-Leiste links */
  .row::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
  }

  .row:hover {
    background: color-mix(in srgb, var(--color-ink) 3%, transparent);
  }

  .row-crit::before {
    background: var(--color-crit);
  }

  .row-warn::before {
    background: var(--color-warn);
  }

  .row-done {
    opacity: 0.62;
  }

  .name {
    grid-area: name;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .row-link {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.02em;
    color: var(--color-ink);
    text-decoration: none;
  }

  /* Overlay: ganze Zeile klickbar */
  .row-link::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  .row-link:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .meta {
    grid-area: meta;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    color: var(--color-ink-2);
  }

  .meta .sep {
    color: var(--color-ink-3);
  }

  .deadline,
  .cost {
    text-align: right;
    white-space: nowrap;
  }

  .deadline {
    grid-area: deadline;
  }

  .cost {
    grid-area: cost;
  }

  .d-days,
  .c-amt {
    font: 600 14.5px/1.2 var(--font-mono);
  }

  .row-crit .d-days {
    color: var(--color-crit);
  }

  .row-warn .d-days {
    color: var(--color-warn);
  }

  .d-date,
  .c-cycle {
    margin-top: 0.2rem;
    font-size: 12px;
    color: var(--color-ink-3);
  }

  .acts {
    grid-area: acts;
    position: relative;
    display: flex;
    gap: 0.125rem;
  }

  /* === Leer- und Null-Treffer-Zustand === */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: var(--color-ink-2);
    text-align: center;
  }

  /* === Responsive === */
  @media (max-width: 640px) {
    .page {
      padding: 1.75rem 1rem 3rem;
    }

    .figure {
      font-size: 40px;
    }

    .tiles {
      grid-template-columns: 1fr;
    }

    .tile,
    .tile + .tile:not(.tile-hero + .tile) {
      padding: 0.875rem 0;
      border-right: 0;
      border-bottom: 1px solid var(--color-line);
    }

    .tile:last-child {
      border-bottom: 0;
    }
  }

  @media (max-width: 560px) {
    /* Aktionen bleiben auf dem Handy erreichbar, rutschen nur in die dritte Zeile */
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "name cost"
        "meta cost"
        "deadline acts";
    }

    .deadline {
      margin-top: 0.5rem;
      text-align: left;
    }

    .acts {
      justify-self: end;
    }
  }
</style>
