<script lang="ts">
  import { SITE } from '$lib/site';
  import { centerFreqMHz } from '$lib/stores/app-state';
  import { base } from '$app/paths';
  import { antennasByTier, engineeringTools } from '$lib/registry';

  // Homepage quick calculator: derive one Center Frequency from the operator's
  // one or two most-used frequencies (CONTEXT: Center Frequency). Sets the store
  // that every calculator reads via the masthead + URL handoff.
  let f1 = $state('7.150');
  let f2 = $state('');

  const center = $derived.by(() => {
    const a = Number(f1);
    const b = Number(f2);
    const aOk = Number.isFinite(a) && a > 0;
    const bOk = Number.isFinite(b) && b > 0;
    if (aOk && bOk) return (a + b) / 2;
    if (aOk) return a;
    return NaN;
  });

  function useCenter() {
    if (Number.isFinite(center)) centerFreqMHz.set(Number(center.toFixed(4)));
  }

  const antennaGroups = antennasByTier();
  const tools = engineeringTools;
</script>

<svelte:head>
  <title>{SITE.titleSuffix} — amateur radio calculators</title>
  <meta name="description" content={SITE.description} />
</svelte:head>

<section class="hero">
  <h1 class="hero-title">{SITE.tagline}</h1>
  <p class="lead">
    First-principles antenna calculators for hams, RF engineers, students, and makers. Every
    result shows its correction factor, its method, and an honest accuracy note — no magic numbers.
    All math runs in your browser and works offline.
  </p>
</section>

<div class="eyebrow"><span class="no">00</span> Quick start · set your Center Frequency</div>
<div class="quick">
  <div class="qfields">
    <div class="field">
      <label for="f1">Most-used frequency</label>
      <div class="ipt"><input id="f1" class="tnum" inputmode="decimal" bind:value={f1} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="f2">Second (optional)</label>
      <div class="ipt"><input id="f2" class="tnum" inputmode="decimal" bind:value={f2} placeholder="—" /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="fc">Center frequency</label>
      <div class="ipt output">
        <input id="fc" class="tnum" value={Number.isFinite(center) ? center.toFixed(3) : '—'} readonly />
        <span class="u">MHz</span><span class="outtag">DERIVED</span>
      </div>
    </div>
  </div>
  <button class="btn" onclick={useCenter} disabled={!Number.isFinite(center)}>Use this frequency</button>
  <p class="cap">Flows into every Designer and Tool via the masthead field and shareable links.</p>
</div>

<div class="eyebrow"><span class="no">01</span> Engineering Tools</div>
<div class="grid">
  {#each tools as t}
    <a class="tile" href={`${base}/tools/${t.slug}`}>
      <span class="tname">{t.name}</span>
      <span class="tmeta tnum">{t.exact ? 'exact' : t.method}</span>
    </a>
  {/each}
</div>

<div class="eyebrow"><span class="no">02</span> Antenna Models</div>
{#each antennaGroups as group}
  <p class="grouplabel">{group.label}</p>
  <div class="grid">
    {#each group.models as m}
      <a class="tile" href={`${base}/antennas/${m.slug}`}>
        <span class="tname">{m.name}</span>
        <span class="tmeta">{m.method}{#if m.loadable} · loadable{/if}</span>
      </a>
    {/each}
  </div>
{/each}

<style>
  .hero {
    padding: 26px 0 6px;
  }
  .hero .lead {
    max-width: 62ch;
    margin-top: 12px;
  }

  .quick {
    border: 1px solid var(--rule-strong);
    background: var(--panel);
    padding: 16px;
  }
  .qfields {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  .quick .cap {
    font-family: var(--mono);
    font-size: 10.5px;
    color: var(--ink-3);
    margin: 10px 0 0;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .grouplabel {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin: 16px 0 8px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid var(--rule);
    background: var(--panel);
    padding: 12px 13px;
    text-decoration: none;
    color: var(--ink);
  }
  .tile:hover {
    border-color: var(--ink);
  }
  .tname {
    font-family: var(--display);
    font-size: 16px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    line-height: 1.05;
  }
  .tmeta {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--signal-ink);
  }

  @media (max-width: 640px) {
    .qfields {
      grid-template-columns: 1fr;
    }
  }
</style>
