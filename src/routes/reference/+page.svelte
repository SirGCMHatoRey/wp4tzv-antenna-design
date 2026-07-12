<script lang="ts">
  import { pageTitle } from '$lib/site';
  // Reference surface — band charts, wire tables, coax data (coarse per the map).
  // Placeholder index; content tables land as their tickets are picked up.
  const planned = [
    { name: 'Band Plan by Region', note: 'IARU Region 1 / 2 / 3 edges + US license-class privileges' },
    { name: 'Wire & Conductor Table', note: 'AWG → diameter, resistance, current' },
    { name: 'Coax Data', note: 'velocity factor + loss per 100 ft (feeds Feed Line Loss)' },
    { name: 'Velocity Factors', note: 'common insulations and dielectrics' }
  ];
</script>

<svelte:head>
  <title>{pageTitle('Reference')}</title>
</svelte:head>

<section class="hero">
  <h1 class="hero-title">Reference</h1>
  <p class="lead">Tables and charts the calculators draw on — band plans, conductor data, coax specs.</p>
</section>

<div class="grid">
  {#each planned as r}
    <div class="tile">
      <span class="tname">{r.name}</span>
      <span class="tmeta">{r.note}</span>
      <span class="badge">planned</span>
    </div>
  {/each}
</div>

<style>
  .hero {
    padding: 22px 0 6px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 2px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    border: 1px solid var(--rule);
    background: var(--panel);
    padding: 13px;
  }
  .tname {
    font-family: var(--display);
    font-size: 17px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .tmeta {
    color: var(--ink-2);
    font-size: 13px;
  }
</style>
