<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { computeAntenna } from './engine';
  import type { AntennaDesign, GroundSystem } from './types';
  import { units, centerFreqMHz } from '$lib/stores/app-state';
  import { lengthDisp, fmt } from '$lib/format';

  let { design }: { design: AntennaDesign } = $props();

  // Parent remounts this component per model via {#key m.slug}, so plain
  // initial state is correct — no cross-model reset needed.
  let fMHz = $state($centerFreqMHz);
  let k = $state(untrack(() => design.defaultK));
  let apexDeg = $state(120);
  // Ground System (issue #4): only meaningful for models that declare `ground`.
  let groundSystem = $state<GroundSystem>(untrack(() => design.ground?.default ?? 'none'));

  const r = $derived(
    computeAntenna(design, { fMHz: Number(fMHz), k: Number(k), apexDeg: Number(apexDeg), groundSystem })
  );
  const imperial = $derived($units === 'ft');

  // ---- URL sync + initial parse ----
  onMount(() => {
    const q = new URLSearchParams(window.location.search);
    const f = Number(q.get('f'));
    if (Number.isFinite(f) && f > 0) fMHz = f;
    const kk = Number(q.get('k'));
    if (Number.isFinite(kk) && kk > 0) k = kk;
    const ap = Number(q.get('apex'));
    if (Number.isFinite(ap) && ap > 0) apexDeg = ap;
    const g = q.get('g');
    if (design.ground && (g === 'elevated-radials' || g === 'ground-radials' || g === 'none')) {
      groundSystem = g;
    }
  });
  $effect(() => {
    if (!browser) return;
    const q = new URLSearchParams();
    q.set('f', String(Number(fMHz)));
    q.set('k', String(Number(k)));
    if (design.hasApex) q.set('apex', String(Number(apexDeg)));
    if (design.ground) q.set('g', groundSystem);
    history.replaceState(history.state, '', `?${q.toString()}`);
  });

  // ---- Loading Coil handoff (one-way deep link, ADR-0007) ----
  const handoffH = $derived.by(() => {
    // "Shorten & load": prefill a deliberately short radiator (60% of resonant)
    // so the Loading Coil opens on a real loaded design, not ALREADY_RESONANT.
    // vertical → radiator (found by key — the radial dim can be absent now);
    // dipole → one leg (the element to load).
    const full =
      design.shape === 'vertical'
        ? (r.dims.find((d) => d.key === 'rad')?.m ?? r.dims[0].m)
        : r.primaryM / 2;
    return full * 0.6;
  });
  const handoffUrl = $derived(
    `${base}/tools/loading-coil?f=${Number(fMHz)}&pos=base&H=${handoffH.toFixed(3)}&u=m`
  );

  // ---- diagram helpers ----
  const lam = $derived(lengthDisp(r.lambdaM, imperial, 2));
  // Read the vertical's radiator/radial dims from the *result* by key, never by
  // position — the radial dim disappears under groundSystem 'none' (issue #4).
  const radiatorDim = $derived(r.dims.find((d) => d.key === 'rad') ?? r.dims[0]);
  const radialDimResult = $derived(r.dims.find((d) => d.key === 'radial'));
  const needsMatchingNetwork = $derived(r.feed.toLowerCase().includes('matching network'));
</script>

<header class="thead">
  <p class="kicker">Antenna Model · Designer · closed-form</p>
  <h1 class="hero-title">{design.name}</h1>
  <p class="formula tnum">length = factor × λ × k &nbsp;·&nbsp; λ = {lam.value} {lam.unit} @ {fmt(fMHz, 3)} MHz</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="f">Design frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="k">Correction factor k <span class="exposed">exposed</span></label>
      <div class="ipt"><input id="k" class="tnum" inputmode="decimal" bind:value={k} /><span class="u">k</span></div>
      <p class="kbasis">{design.kBasis}</p>
    </div>
    {#if design.hasApex}
      <div class="field">
        <label for="apex">Apex included angle</label>
        <div class="ipt"><input id="apex" class="tnum" inputmode="decimal" min="60" max="180" bind:value={apexDeg} /><span class="u">°</span></div>
      </div>
    {/if}

    {#if design.ground}
      <div class="field">
        <span class="lbl">Ground system</span>
        <div class="seg" role="group" aria-label="Ground system">
          {#each design.ground.options as opt}
            <button
              type="button"
              aria-pressed={groundSystem === opt}
              onclick={() => (groundSystem = opt)}
            >
              {opt === 'elevated-radials' ? 'Elevated' : opt === 'ground-radials' ? 'Ground-mounted' : 'No radials'}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if design.loadable}
      <a class="btn" href={handoffUrl} data-sveltekit-preload-data="off">Shorten &amp; load — send to Loading Coil →</a>
    {/if}
  </aside>

  <section class="treadout">
    <!-- diagram -->
    <div class="figframe" style="min-height:210px;padding:0">
      <span class="tagf">FIG.1 · {design.name.toUpperCase()}</span>
      <svg viewBox="0 0 620 210" role="img" aria-label={`${design.name} geometry`}>
        {#if design.shape === 'dipole'}
          <line x1="80" y1="105" x2="300" y2="105" stroke="var(--ink)" stroke-width="2.5" />
          <line x1="320" y1="105" x2="540" y2="105" stroke="var(--ink)" stroke-width="2.5" />
          <circle cx="310" cy="105" r="4" fill="var(--signal)" />
          <line x1="310" y1="109" x2="310" y2="150" stroke="var(--signal)" stroke-width="1.5" stroke-dasharray="3 3" />
          <text x="310" y="166" text-anchor="middle" fill="var(--signal-ink)" font-family="var(--mono)" font-size="11">feed</text>
          <text x="310" y="88" text-anchor="middle" fill="var(--ink)" font-family="var(--mono)" font-size="12">total {lengthDisp(r.primaryM, imperial).value} {lengthDisp(r.primaryM, imperial).unit}</text>
          <text x="195" y="98" text-anchor="middle" fill="var(--ink-2)" font-family="var(--mono)" font-size="11">leg {lengthDisp(r.primaryM / 2, imperial).value}</text>
        {:else if design.shape === 'wire'}
          <rect x="70" y="95" width="20" height="20" fill="none" stroke="var(--signal)" stroke-width="1.5" />
          <text x="80" y="135" text-anchor="middle" fill="var(--signal-ink)" font-family="var(--mono)" font-size="10">feed</text>
          <line x1="90" y1="105" x2="550" y2="105" stroke="var(--ink)" stroke-width="2.5" />
          <text x="320" y="90" text-anchor="middle" fill="var(--ink)" font-family="var(--mono)" font-size="12">{r.dims[0].label} {lengthDisp(r.dims[0].m, imperial).value} {lengthDisp(r.dims[0].m, imperial).unit}</text>
        {:else if design.shape === 'vertical'}
          <line x1="310" y1="30" x2="310" y2="160" stroke="var(--ink)" stroke-width="2.5" />
          <circle cx="310" cy="160" r="4" fill="var(--signal)" />
          {#if needsMatchingNetwork}
            <rect x="298" y="160" width="24" height="14" fill="none" stroke="var(--signal)" stroke-width="1.5" />
            <text x="310" y="184" text-anchor="middle" fill="var(--signal-ink)" font-family="var(--mono)" font-size="9">match</text>
          {/if}
          {#if radialDimResult}
            <line x1="230" y1="175" x2="390" y2="175" stroke="var(--ink-2)" stroke-width="1" />
            <line x1="310" y1="160" x2="240" y2="178" stroke="var(--ink-2)" stroke-width="1.5" />
            <line x1="310" y1="160" x2="380" y2="178" stroke="var(--ink-2)" stroke-width="1.5" />
            <text x="310" y="196" text-anchor="middle" fill="var(--ink-2)" font-family="var(--mono)" font-size="10">{radialDimResult.label.toLowerCase()}</text>
          {/if}
          <text x="322" y="96" fill="var(--ink)" font-family="var(--mono)" font-size="12">radiator {lengthDisp(radiatorDim.m, imperial).value} {lengthDisp(radiatorDim.m, imperial).unit}</text>
        {:else if design.shape === 'loop'}
          {#if design.loopSides === 3}
            <polygon points="310,35 200,165 420,165" fill="none" stroke="var(--ink)" stroke-width="2.5" />
            <circle cx="310" cy="165" r="4" fill="var(--signal)" />
          {:else}
            <rect x="215" y="45" width="190" height="120" fill="none" stroke="var(--ink)" stroke-width="2.5" />
            <circle cx="310" cy="165" r="4" fill="var(--signal)" />
          {/if}
          <text x="310" y="192" text-anchor="middle" fill="var(--ink)" font-family="var(--mono)" font-size="12">perimeter {lengthDisp(r.primaryM, imperial).value} {lengthDisp(r.primaryM, imperial).unit} · side {lengthDisp(r.dims[1].m, imperial).value}</text>
        {/if}
      </svg>
    </div>

    <!-- dimensions readout -->
    <div class="rrow" style="margin-top:14px">
      {#each r.dims as d}
        <div class="rbig"><div class="k">{d.label}</div><div class="v tnum">{lengthDisp(d.m, imperial).value}<small>{lengthDisp(d.m, imperial).unit}</small></div></div>
      {/each}
    </div>

    <!-- honesty pair + feed + notes -->
    <div class="accuracy" style="margin-top:14px">
      <span class="lab">Accuracy note</span><br />
      {r.accuracy}
      <div class="badges">
        <span class="badge">Method <b>closed-form</b></span>
        <span class="badge">Cite <b>{design.cite}</b></span>
        <span class="badge">Feed <b>{r.feed}</b></span>
      </div>
    </div>

    <ul class="notes">
      {#each r.notes as n}<li>{n}</li>{/each}
    </ul>
  </section>
</div>

<style>
  .exposed {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 0.08em;
    color: var(--signal-ink);
    border: 1px solid var(--rule-strong);
    padding: 0 3px;
    margin-left: 4px;
    text-transform: uppercase;
  }
  .kbasis {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-3);
    line-height: 1.6;
    margin: 5px 0 0;
  }
  .field .lbl {
    display: block;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin-bottom: 4px;
  }
  .btn {
    margin-top: 8px;
    width: 100%;
    text-align: center;
    font-size: 12px;
  }
  .notes {
    margin: 12px 0 0;
    padding-left: 18px;
    color: var(--ink-2);
    font-size: 13px;
    line-height: 1.7;
  }
  .figframe {
    display: flex;
    align-items: center;
  }
  .figframe svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
