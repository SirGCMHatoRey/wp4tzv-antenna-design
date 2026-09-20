<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { computeAntenna } from './engine';
  import type { AntennaDesign, GroundSystem } from './types';
  import { units, centerFreqMHz } from '$lib/stores/app-state';
  import { lengthDisp, fmt } from '$lib/format';
  import { writeLinkToAddressBar } from '$lib/shareable-link';
  import { parseDesignerLink, serializeDesignerLink } from './designer-link';
  import { decodeCoil, encodeCoil, outboundUrl, type AntennaContext } from './coil-handoff';
  import { fromCoil, coilUnit, toUnitSystem } from '$lib/tools/loading-coil/units';

  let { design }: { design: AntennaDesign } = $props();

  // Parent remounts this component per model via {#key m.slug}, so plain
  // initial state is correct — no cross-model reset needed.
  let fMHz = $state($centerFreqMHz);
  let k = $state(untrack(() => design.defaultK));
  let apexDeg = $state(120);
  // Ground System (issue #4): only meaningful for models that declare `ground`.
  let groundSystem = $state<GroundSystem>(untrack(() => design.ground?.default ?? 'none'));
  // Loaded coil (ADR-0009): the raw `coil=` link value, decoded on demand. Only
  // loadable models honour it — anywhere else it is ignored and dropped.
  let coilParam = $state<string | null>(null);
  const initialSearch = browser ? window.location.search : ''; // before the URL-sync effect rewrites it

  const r = $derived(
    computeAntenna(design, { fMHz: Number(fMHz), k: Number(k), apexDeg: Number(apexDeg), groundSystem })
  );
  const imperial = $derived($units === 'ft');

  // ---- URL sync + initial parse (ADR-0008 decision 4, issue #14) ----
  onMount(() => {
    const parsed = parseDesignerLink(window.location.search, design, { fMHz: $centerFreqMHz, k: design.defaultK });
    fMHz = parsed.fMHz;
    k = parsed.k;
    apexDeg = parsed.apexDeg;
    groundSystem = parsed.groundSystem;
    if (design.loadable) coilParam = new URLSearchParams(initialSearch).get('coil');
  });
  $effect(() => {
    if (!browser) return;
    const qs = serializeDesignerLink(
      { fMHz: Number(fMHz), k: Number(k), apexDeg: Number(apexDeg), groundSystem },
      design
    );
    if (!coilParam) return writeLinkToAddressBar(qs);
    const withCoil = new URLSearchParams(qs);
    withCoil.set('coil', coilParam);
    writeLinkToAddressBar(withCoil.toString());
  });

  // ---- Loading Coil handoff (two-way URL handoff, ADR-0009) ----
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
  const loaded = $derived(design.loadable ? decodeCoil(coilParam) : null);
  const antennaCtx = $derived<AntennaContext>({
    slug: design.slug,
    k: Number(k),
    apexDeg: design.hasApex ? Number(apexDeg) : undefined,
    groundSystem: design.ground ? groundSystem : undefined
  });
  // With a loaded coil the trip resumes *that* coil; otherwise the short prefill.
  const handoffUrl = $derived(
    outboundUrl(base, antennaCtx, { fMHz: Number(fMHz), hM: handoffH }, loaded?.ui)
  );

  // Loaded configuration panel: coil dims follow the global units switch.
  const coilSys = $derived(toUnitSystem($units));
  const cu = $derived(coilUnit(coilSys));
  const coilDp = $derived(cu === 'mm' ? 1 : 3);
  const coilPosLabel = $derived(
    !loaded
      ? ''
      : loaded.ui.pos === 'base'
        ? 'base'
        : loaded.ui.pos === 'center'
          ? 'center'
          : `${Math.round(loaded.ui.pos * 100)}% of height`
  );
  const coilStale = $derived(!!loaded && Math.abs(loaded.ui.fMHz - Number(fMHz)) > 1e-6);

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
      <a class="btn" href={handoffUrl} data-sveltekit-preload-data="off">{loaded ? 'Edit coil →' : 'Shorten & load — send to Loading Coil →'}</a>
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

    {#if loaded}
      <div class="loaded" aria-label="Loaded configuration">
        <div class="lhead">
          <span class="lt">Loaded configuration</span>
          <span class="ls tnum">sized for {fmt(loaded.ui.fMHz, 3)} MHz · {coilPosLabel}-loaded</span>
        </div>
        <div class="lgrid">
          <div class="lcell"><div class="k">Inductance L</div><div class="v tnum">{fmt(loaded.coil.LuH, 2)}<small>µH</small></div></div>
          <div class="lcell"><div class="k">Turns N</div><div class="v tnum">{fmt(loaded.coil.N, 1)}</div></div>
          <div class="lcell"><div class="k">Form diameter d</div><div class="v tnum">{fmt(fromCoil(loaded.coil.dM, coilSys), coilDp)}<small>{cu}</small></div></div>
          <div class="lcell"><div class="k">Coil length ℓ</div><div class="v tnum">{fmt(fromCoil(loaded.coil.lenM, coilSys), coilDp)}<small>{cu}</small></div></div>
        </div>
        {#if coilStale}
          <p class="lstale" role="status">
            Frequency is now {fmt(Number(fMHz), 3)} MHz. This coil was sized for {fmt(loaded.ui.fMHz, 3)} MHz — re-tune it with Edit coil.
          </p>
        {/if}
        <p class="lnote">The full-size dimensions above are the formula reference; the coil makes the shortened radiator resonant.</p>
      </div>
    {/if}

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
  .loaded {
    margin-top: 14px;
    border: 1px solid var(--signal-ink);
    border-left-width: 4px;
    padding: 10px 12px 12px;
  }
  .lhead {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .lt {
    font-weight: 600;
  }
  .ls {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink-2);
  }
  .lgrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    margin-top: 10px;
  }
  .lcell .k {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-2);
  }
  .lcell .v {
    font-size: 20px;
    font-weight: 600;
  }
  .lcell small {
    font-size: 11px;
    margin-left: 3px;
    color: var(--ink-2);
  }
  .lstale {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--signal-ink);
  }
  .lnote {
    margin: 8px 0 0;
    font-size: 11px;
    color: var(--ink-3);
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
