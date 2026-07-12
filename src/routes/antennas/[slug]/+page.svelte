<script lang="ts">
  import { pageTitle } from '$lib/site';
  import type { PageData } from './$types';
  import FigureFrame from '$lib/components/FigureFrame.svelte';
  import Designer from '$lib/antennas/Designer.svelte';
  import Tier2Designer from '$lib/antennas/Tier2Designer.svelte';
  import { ANTENNA_DESIGNS } from '$lib/antennas/models';
  import { TIER2_DESIGNS } from '$lib/antennas/tier2';
  let { data }: { data: PageData } = $props();
  const m = $derived(data.model);
  const design = $derived(ANTENNA_DESIGNS[m.slug]);
  const tier2 = $derived(TIER2_DESIGNS[m.slug as keyof typeof TIER2_DESIGNS]);
</script>

<svelte:head>
  <title>{pageTitle(m.name)}</title>
</svelte:head>

{#if design}
  {#key m.slug}
    <Designer {design} />
  {/key}
{:else if tier2}
  {#key m.slug}
    <Tier2Designer design={tier2} />
  {/key}
{:else}
<section class="hero">
  <p class="kicker">Antenna Model · Tier {m.tier} · {m.method}</p>
  <h1 class="hero-title">{m.name}</h1>
  <p class="src">Source: {m.source}{#if m.loadable} · offers shorten &amp; load handoff{/if}</p>
</section>

<FigureFrame tag="GEOMETRY">
  <div class="stub">
    <p class="lead">This Designer's geometry diagram + readout mount here.</p>
    <p class="note">
      Shell + component kit ready. Tier-1 models share one closed-form λ = c/f × k Designer engine
      (ADR-0002); this page renders it once built.
    </p>
  </div>
</FigureFrame>
{/if}

<style>
  .hero {
    padding: 22px 0 14px;
  }
  .kicker {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--signal-ink);
    margin: 0 0 4px;
  }
  .src {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--ink-3);
    margin: 10px 0 0;
  }
  .stub {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 30px;
    gap: 8px;
  }
  .stub .note {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--ink-3);
    max-width: 56ch;
    line-height: 1.7;
  }
</style>
