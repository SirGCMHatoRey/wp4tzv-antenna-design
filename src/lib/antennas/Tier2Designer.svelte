<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { units, centerFreqMHz } from '$lib/stores/app-state';
  import { lengthDisp, fmt } from '$lib/format';
  import type { Tier2Design, JVariant } from './tier2';

  let { design }: { design: Tier2Design } = $props();

  let fMHz = $state($centerFreqMHz);
  let k = $state(untrack(() => design.defaultK));
  let elements = $state(3);
  let variant = $state<JVariant>('jpole');

  const r = $derived(
    design.compute({ fMHz: Number(fMHz), k: Number(k), elements: Number(elements), variant })
  );
  const imperial = $derived($units === 'ft');

  onMount(() => {
    const q = new URLSearchParams(window.location.search);
    const f = Number(q.get('f'));
    if (Number.isFinite(f) && f > 0) fMHz = f;
    const kk = Number(q.get('k'));
    if (Number.isFinite(kk) && kk > 0) k = kk;
    const el = Number(q.get('el'));
    if (Number.isFinite(el) && el > 0) elements = el;
    const v = q.get('var');
    if (v === 'jpole' || v === 'slimjim') variant = v;
  });
  $effect(() => {
    if (!browser) return;
    const q = new URLSearchParams();
    q.set('f', String(Number(fMHz)));
    q.set('k', String(Number(k)));
    if (design.hasElements) q.set('el', String(Number(elements)));
    if (design.hasVariant) q.set('var', variant);
    history.replaceState(history.state, '', `?${q.toString()}`);
  });

  // diagram scale helpers (fit into the 620×220 viewbox)
  const px = $derived.by(() => {
    const maxDim = Math.max(...r.dims.map((d) => d.m), r.lambdaM * 0.5);
    return (m: number) => (m / maxDim) * 240; // px per model metre-ish
  });
</script>

<header class="thead">
  <p class="kicker">Antenna Model · Designer · published-design</p>
  <h1 class="hero-title">{design.name}</h1>
  <p class="formula tnum">λ = {lengthDisp(r.lambdaM, imperial, 2).value} {lengthDisp(r.lambdaM, imperial, 2).unit} @ {fmt(fMHz, 3)} MHz · {design.cite}</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="f">Design frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="k">{design.kLabel} <span class="exposed">exposed</span></label>
      <div class="ipt"><input id="k" class="tnum" inputmode="decimal" bind:value={k} /><span class="u">{design.hasVariant ? 'VF' : 'k'}</span></div>
    </div>

    {#if design.hasElements}
      <div class="field">
        <span class="lbl">Elements</span>
        <div class="seg" role="group" aria-label="Element count">
          {#each [3, 4, 5, 6] as n}
            <button type="button" aria-pressed={elements === n} onclick={() => (elements = n)}>{n}</button>
          {/each}
        </div>
      </div>
    {/if}

    {#if design.hasVariant}
      <div class="field">
        <span class="lbl">Variant</span>
        <div class="seg" role="group" aria-label="Variant">
          <button type="button" aria-pressed={variant === 'jpole'} onclick={() => (variant = 'jpole')}>J-Pole</button>
          <button type="button" aria-pressed={variant === 'slimjim'} onclick={() => (variant = 'slimjim')}>Slim Jim</button>
        </div>
      </div>
    {/if}

    {#if r.extras.length}
      <div class="extras">
        {#each r.extras as e}
          <div class="ex"><span class="exk">{e.label}</span><span class="exv tnum">{e.value}</span></div>
        {/each}
      </div>
    {/if}
  </aside>

  <section class="treadout">
    <div class="figframe" style="min-height:220px;padding:0">
      <span class="tagf">FIG.1 · {design.name.toUpperCase()}</span>
      <svg viewBox="0 0 620 220" role="img" aria-label={`${design.name} geometry`}>
        {#if r.shape === 'yagi'}
          {@const boomX0 = 70}
          {@const step = 480 / Math.max(r.dims.length - 1, 1)}
          <line x1={boomX0} y1="110" x2={boomX0 + step * (r.dims.length - 1)} y2="110" stroke="var(--ink-2)" stroke-width="2" />
          {#each r.dims as d, i}
            {@const h = px(d.m) * 0.5}
            {@const x = boomX0 + step * i}
            <line x1={x} y1={110 - h} x2={x} y2={110 + h} stroke={i === 1 ? 'var(--signal)' : 'var(--ink)'} stroke-width="2.5" />
            <text {x} y={110 + h + 14} text-anchor="middle" fill="var(--ink-3)" font-family="var(--mono)" font-size="9">{d.key}</text>
          {/each}
          <text x="72" y="24" fill="var(--signal-ink)" font-family="var(--mono)" font-size="10">← reflector · driven (amber) · directors →</text>
        {:else if r.shape === 'moxon'}
          {@const A = px(r.dims[0].m)}
          {@const dep = px(r.dims[4].m) * 1.2}
          {@const x0 = 310 - A / 2}
          {@const y0 = 110 - dep / 2}
          <line x1={x0} y1={y0} x2={x0 + A} y2={y0} stroke="var(--signal)" stroke-width="2.5" />
          <line x1={x0} y1={y0 + dep} x2={x0 + A} y2={y0 + dep} stroke="var(--ink)" stroke-width="2.5" />
          <line x1={x0} y1={y0} x2={x0} y2={y0 + dep * 0.42} stroke="var(--signal)" stroke-width="2.5" />
          <line x1={x0 + A} y1={y0} x2={x0 + A} y2={y0 + dep * 0.42} stroke="var(--signal)" stroke-width="2.5" />
          <line x1={x0} y1={y0 + dep} x2={x0} y2={y0 + dep * 0.55} stroke="var(--ink)" stroke-width="2.5" />
          <line x1={x0 + A} y1={y0 + dep} x2={x0 + A} y2={y0 + dep * 0.55} stroke="var(--ink)" stroke-width="2.5" />
          <text x={x0 + A / 2} y={y0 - 8} text-anchor="middle" fill="var(--signal-ink)" font-family="var(--mono)" font-size="10">driven (A)</text>
          <text x={x0 + A / 2} y={y0 + dep + 16} text-anchor="middle" fill="var(--ink-2)" font-family="var(--mono)" font-size="10">reflector</text>
        {:else if r.shape === 'jpole'}
          {@const rad = px(r.dims[0].m)}
          {@const stub = px(r.dims[1].m)}
          {@const baseY = 200}
          <line x1="300" y1={baseY} x2="300" y2={baseY - rad} stroke="var(--ink)" stroke-width="2.5" />
          <line x1="326" y1={baseY} x2="326" y2={baseY - stub} stroke="var(--ink)" stroke-width="2.5" />
          <line x1="300" y1={baseY} x2="326" y2={baseY} stroke="var(--ink)" stroke-width="2.5" />
          <circle cx="313" cy={baseY - px(r.dims[3].m)} r="4" fill="var(--signal)" />
          <text x="340" y={baseY - stub} fill="var(--ink-2)" font-family="var(--mono)" font-size="10">¼λ stub</text>
          <text x="285" y={baseY - rad + 4} text-anchor="end" fill="var(--ink)" font-family="var(--mono)" font-size="10">½λ radiator</text>
          <text x="330" y={baseY - px(r.dims[3].m)} fill="var(--signal-ink)" font-family="var(--mono)" font-size="9">feed tap</text>
        {/if}
      </svg>
    </div>

    <div class="rrow" style="margin-top:14px">
      {#each r.dims as d}
        <div class="rbig"><div class="k">{d.label}</div><div class="v tnum">{lengthDisp(d.m, imperial).value}<small>{lengthDisp(d.m, imperial).unit}</small></div></div>
      {/each}
    </div>

    <div class="accuracy" style="margin-top:14px">
      <span class="lab">Accuracy note</span><br />
      {design.accuracy}
      <div class="badges">
        <span class="badge">Method <b>published-design</b></span>
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
  .extras {
    border: 1px solid var(--rule);
    margin-top: 14px;
  }
  .ex {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 10px;
    border-top: 1px solid var(--rule);
    font-size: 12px;
  }
  .ex:first-child {
    border-top: none;
  }
  .exk {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .exv {
    color: var(--signal-ink);
    font-family: var(--mono);
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
  .lbl {
    display: block;
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    color: var(--ink-2);
    margin-bottom: 4px;
    text-transform: uppercase;
  }
</style>
