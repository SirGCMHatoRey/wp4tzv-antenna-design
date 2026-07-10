<script lang="ts">
  import { engineeringTools } from '$lib/registry';
  import { base } from '$app/paths';
  const exact = engineeringTools.filter((t) => t.exact);
  const approx = engineeringTools.filter((t) => !t.exact);
</script>

<svelte:head>
  <title>Engineering Tools — Antenna Design Portal</title>
</svelte:head>

<section class="hero">
  <h1 class="hero-title">Engineering Tools</h1>
  <p class="lead">
    Calculators that take electrical parameters and return a value or a single component's geometry.
    Exact tools are closed math; approximating tools declare their method and an honest accuracy note.
  </p>
</section>

<div class="eyebrow"><span class="no">01</span> Exact</div>
<div class="grid">
  {#each exact as t}
    <a class="tile" href={`${base}/tools/${t.slug}`}>
      <span class="tname">{t.name}</span>
      <span class="tmeta tnum">{t.formula}</span>
    </a>
  {/each}
</div>

<div class="eyebrow"><span class="no">02</span> Approximating · declares method + accuracy note</div>
<div class="grid">
  {#each approx as t}
    <a class="tile" href={`${base}/tools/${t.slug}`}>
      <span class="tname">{t.name}</span>
      <span class="tmeta">{t.method} · {t.formula}</span>
    </a>
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
    gap: 5px;
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
  }
  .tmeta {
    font-family: var(--mono);
    font-size: 10.5px;
    color: var(--signal-ink);
  }
</style>
