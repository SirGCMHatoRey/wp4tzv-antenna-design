<script lang="ts">
  import { antennasByTier } from '$lib/registry';
  const groups = antennasByTier();
</script>

<svelte:head>
  <title>Antenna Models — Antenna Design Portal</title>
</svelte:head>

<section class="hero">
  <h1 class="hero-title">Antenna Models</h1>
  <p class="lead">
    Each Designer turns a frequency and options into geometry, a diagram, and construction notes —
    with its correction factor exposed and its design method cited. Short antennas offer a
    "shorten &amp; load" handoff into the Loading Coil tool.
  </p>
</section>

{#each groups as group}
  <div class="eyebrow"><span class="no">T{group.tier}</span> {group.label.replace(/^Tier \d+ · /, '')}</div>
  <div class="grid">
    {#each group.models as m}
      <a class="tile" href={`/antennas/${m.slug}`}>
        <span class="tname">{m.name}</span>
        <span class="tmeta">{m.method}{#if m.loadable} · loadable{/if}</span>
        <span class="src">{m.source}</span>
      </a>
    {/each}
  </div>
{/each}

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
    gap: 4px;
    border: 1px solid var(--rule);
    background: var(--panel);
    padding: 13px;
    text-decoration: none;
    color: var(--ink);
  }
  .tile:hover {
    border-color: var(--ink);
  }
  .tname {
    font-family: var(--display);
    font-size: 17px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 1.05;
  }
  .tmeta {
    font-family: var(--mono);
    font-size: 10.5px;
    color: var(--signal-ink);
  }
  .src {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-3);
  }
</style>
