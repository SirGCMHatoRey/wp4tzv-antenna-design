<script lang="ts">
  import { pageTitle } from '$lib/site';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { computeLoadingCoil } from '$lib/tools/loading-coil/engine';
  import { parse, serialize, toEngineInputs } from '$lib/tools/loading-coil/codec';
  import { DEFAULTS, BAND_PRESETS, VF_BARE, VF_PVC } from '$lib/tools/loading-coil/defaults';
  import { awgToMm, mmToAwg, COMMON_AWG } from '$lib/tools/loading-coil/wire';
  import {
    fromRadiator, toRadiator, radiatorUnit,
    fromCoil, toCoil, coilUnit
  } from '$lib/tools/loading-coil/units';
  import type { Position, Reason, UIState, UnitSystem } from '$lib/tools/loading-coil/types';

  // ---- editable state, in display units ----
  let units = $state<UnitSystem>(DEFAULTS.units);
  let fMHz = $state(DEFAULTS.fMHz);
  let posSel = $state<'base' | 'center' | 'custom'>(
    typeof DEFAULTS.pos === 'number' ? 'custom' : DEFAULTS.pos
  );
  let posFrac = $state(typeof DEFAULTS.pos === 'number' ? DEFAULTS.pos : 0.5);
  let Hd = $state(fromRadiator(DEFAULTS.H, DEFAULTS.units));
  let ad = $state(fromCoil(DEFAULTS.a, DEFAULTS.units)); // conductor radius
  let vf = $state(DEFAULTS.vf);
  let mode = $state<UIState['mode']>(DEFAULTS.mode);
  let Nin = $state(DEFAULTS.N);
  let dd = $state(fromCoil(DEFAULTS.d, DEFAULTS.units));
  let lend = $state(fromCoil(DEFAULTS.len, DEFAULTS.units));
  let wireIn = $state(DEFAULTS.units === 'imperial' ? mmToAwg(DEFAULTS.wireDiam * 1000) : DEFAULTS.wireDiam * 1000);

  const pos = $derived<Position>(posSel === 'custom' ? posFrac : posSel);

  // ---- assemble SI UIState + compute ----
  const ui = $derived<UIState>({
    v: 1,
    fMHz,
    pos,
    H: toRadiator(Hd, units),
    a: toCoil(ad, units),
    vf,
    mode,
    N: Nin,
    d: toCoil(dd, units),
    len: toCoil(lend, units),
    wireDiam: units === 'imperial' ? awgToMm(wireIn) / 1000 : wireIn / 1000,
    units
  });

  const result = $derived(computeLoadingCoil(toEngineInputs(ui)));

  // ---- URL sync (readable, versioned; outputs never encoded) ----
  $effect(() => {
    if (!browser) return;
    const qs = serialize(ui);
    history.replaceState(history.state, '', `?${qs}`);
  });

  // ---- initial load from URL ----
  onMount(() => {
    const s = parse(window.location.search);
    units = s.units;
    fMHz = s.fMHz;
    posSel = typeof s.pos === 'number' ? 'custom' : s.pos;
    posFrac = typeof s.pos === 'number' ? s.pos : 0.5;
    Hd = fromRadiator(s.H, s.units);
    ad = fromCoil(s.a, s.units);
    vf = s.vf;
    mode = s.mode;
    Nin = s.N;
    dd = fromCoil(s.d, s.units);
    lend = fromCoil(s.len, s.units);
    wireIn = s.units === 'imperial' ? mmToAwg(s.wireDiam * 1000) : s.wireDiam * 1000;
    loadSaves();
  });

  // ---- units toggle: convert existing values, never reset (US35) ----
  function setUnits(next: UnitSystem) {
    if (next === units) return;
    const Hm = toRadiator(Hd, units);
    const am = toCoil(ad, units);
    const dm = toCoil(dd, units);
    const lm = toCoil(lend, units);
    const wireM = units === 'imperial' ? awgToMm(wireIn) / 1000 : wireIn / 1000;
    units = next;
    Hd = fromRadiator(Hm, next);
    ad = fromCoil(am, next);
    dd = fromCoil(dm, next);
    lend = fromCoil(lm, next);
    wireIn = next === 'imperial' ? mmToAwg(wireM * 1000) : wireM * 1000;
  }

  // ---- solve-mode flip: adopt the last computed value into the newly-fixed field ----
  function setMode(m: UIState['mode']) {
    if (m === mode) return;
    if (result.ok) {
      // freeze current outputs so the field that stops being solved stays sensible
      if (mode === 'N') Nin = round(result.values.N, 2);
      if (mode === 'd') dd = round(fromCoil(result.values.dM, units), 3);
      if (mode === 'len') lend = round(fromCoil(result.values.lenM, units), 2);
    }
    mode = m;
  }

  // ---- display helpers ----
  const lu = $derived(radiatorUnit(units));
  const cu = $derived(coilUnit(units));
  function round(n: number, dp: number) {
    return Number(n.toFixed(dp));
  }
  function fmt(n: number, dp: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  // solved-field display values (from the result), or '—' on block
  const outN = $derived(result.ok ? fmt(result.values.N, 1) : '—');
  const outD = $derived(result.ok ? fmt(fromCoil(result.values.dM, units), cu === 'mm' ? 1 : 3) : '—');
  const outLen = $derived(result.ok ? fmt(fromCoil(result.values.lenM, units), cu === 'mm' ? 1 : 3) : '—');

  const readL = $derived(result.ok ? fmt(result.values.LuH, 2) : '—');
  const readN = $derived(result.ok ? fmt(result.values.N, 1) : '—');
  const readZc = $derived(result.ok ? fmt(result.values.zcOhm, 0) : '—');
  const readQ = $derived(result.ok ? fmt(result.values.qEst, 0) : '—');
  const readFs = $derived(result.ok ? fmt(result.values.fSelfMHz, 1) : '—');

  const warnCodes = $derived(result.ok ? result.warnings.map((w) => w.code) : []);
  const lowQ = $derived(warnCodes.includes('LOW_Q'));
  const nearFs = $derived(warnCodes.includes('NEAR_SELF_RESONANCE'));

  // ---- status chip + message copy (frontend owns voice; ADR-0008) ----
  const status = $derived.by(() => {
    if (!result.ok) return { kind: 'block' as const, ...blockCopy(result.blocks[0]) };
    if (result.warnings.length) return { kind: 'warn' as const, msg: warnCopy(result.warnings[0]) };
    return {
      kind: 'ok' as const,
      msg: 'Coil resonates the radiator. <b>Trim to resonance</b> after building — the model is ±10%.'
    };
  });

  function blockCopy(r: Reason): { title: string; msg: string } {
    switch (r.code) {
      case 'ALREADY_RESONANT':
        return {
          title: 'No coil needed',
          msg: 'The radiator is already at resonance here. <b>Shorten it, or move the coil up</b> to require loading.'
        };
      case 'WIRE_WONT_FIT':
        return {
          title: "Wire won't fit",
          msg: `${fmt(r.turns as number, 0)} close-wound turns need ${fmt(r.needMm as number, 0)} mm, but the coil is ${fmt(r.haveMm as number, 0)} mm. <b>Use a coarser wire or a longer coil.</b>`
        };
      case 'NO_REAL_SOLUTION':
      default:
        return {
          title: 'No coil fits',
          msg: 'No coil of the fixed dimensions reaches the required inductance. <b>Change the fixed pair</b> — e.g. more turns or a wider form.'
        };
    }
  }
  function warnCopy(r: Reason): string {
    if (r.code === 'LOW_Q')
      return `Buildable, but <b>Q is low (≈${fmt(r.q as number, 0)})</b> — losses will be high. A wider form or fewer turns raises it.`;
    return `Buildable, but the coil <b>self-resonates near ${fmt(r.fSelfMHz as number, 1)} MHz</b> — close to your ${fmt(fMHz, 3)} MHz design. A shorter, wider coil moves it up.`;
  }

  // ---- coil SVG: schematic-but-proportioned, turns capped at 40 (issue 03) ----
  const DRAW_CAP = 40;
  const coilTurns = $derived.by(() => {
    if (!result.ok) return [];
    const N = result.values.N;
    const dM = result.values.dM;
    const lenM = result.values.lenM;
    const drawn = Math.max(6, Math.min(DRAW_CAP, Math.round(N)));
    // aspect: coil width vs height in the 620×200 viewbox
    const maxW = 420;
    const aspect = lenM / dM; // ℓ/d
    const height = 80; // ry*2 nominal
    let width = Math.min(maxW, Math.max(120, height * aspect));
    const x0 = (620 - width) / 2;
    const step = width / drawn;
    const rx = Math.max(4, Math.min(11, step * 0.7));
    const ry = height / 2;
    const mid = Math.floor(drawn / 2);
    return Array.from({ length: drawn }, (_, i) => ({
      cx: x0 + step * (i + 0.5),
      cy: 100,
      rx,
      ry,
      mid: i === mid
    }));
  });
  const coilExtent = $derived.by(() => {
    if (coilTurns.length === 0) return { x0: 100, x1: 520 };
    return { x0: coilTurns[0].cx - coilTurns[0].rx, x1: coilTurns[coilTurns.length - 1].cx + coilTurns[0].rx };
  });

  // ---- reactance beam ----
  const beam = $derived.by(() => {
    if (!result.ok) return null;
    const v = result.values;
    const bars = [
      { n: '−jX low', v: v.xLowerOhm, cls: 'cap' },
      { n: '−jX up', v: v.xUpperOhm, cls: 'cap' },
      { n: '+jX coil', v: v.xReqOhm, cls: 'ind' }
    ].filter((b) => Math.abs(b.v) > 0.01);
    const max = Math.max(...bars.map((b) => Math.abs(b.v)), 1);
    return { bars, max };
  });

  // ---- share + saved projects (localStorage, ADR-0004) ----
  let toast = $state('');
  function showToast(t: string) {
    toast = t;
    setTimeout(() => (toast = ''), 1800);
  }
  async function share() {
    const url = `${location.origin}${location.pathname}?${serialize(ui)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Copy failed');
    }
  }

  const SAVE_KEY = 'adp:loading-coil:saves';
  interface Save {
    name: string;
    qs: string;
  }
  let saves = $state<Save[]>([]);
  function loadSaves() {
    if (!browser) return;
    try {
      saves = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]');
    } catch {
      saves = [];
    }
  }
  function saveProject() {
    const name = prompt('Name this design:');
    if (!name) return;
    const next = [...saves.filter((s) => s.name !== name), { name, qs: serialize(ui) }];
    saves = next;
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    showToast('Saved');
  }
  function openSave(qs: string) {
    const s = parse(qs);
    units = s.units;
    fMHz = s.fMHz;
    posSel = typeof s.pos === 'number' ? 'custom' : s.pos;
    posFrac = typeof s.pos === 'number' ? s.pos : 0.5;
    Hd = fromRadiator(s.H, s.units);
    ad = fromCoil(s.a, s.units);
    vf = s.vf;
    mode = s.mode;
    Nin = s.N;
    dd = fromCoil(s.d, s.units);
    lend = fromCoil(s.len, s.units);
    wireIn = s.units === 'imperial' ? mmToAwg(s.wireDiam * 1000) : s.wireDiam * 1000;
  }
  function deleteSave(name: string) {
    const next = saves.filter((s) => s.name !== name);
    saves = next;
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  }

  const posLabel = $derived(
    posSel === 'base' ? 'BASE' : posSel === 'center' ? 'CENTER' : `${Math.round(posFrac * 100)}% HEIGHT`
  );
  const wireUnitLabel = $derived(units === 'imperial' ? 'AWG' : 'mm');
</script>

<svelte:head>
  <title>{pageTitle('Loading Coil')}</title>
  <meta
    name="description"
    content="Resonate an electrically-short antenna: compute the required loading inductance (exposed Zc, transmission-line model) then the buildable coil geometry (Nagaoka). First-principles, cited, ±10% honest."
  />
</svelte:head>

<header class="mast">
  <div>
    <p class="kicker">Engineering Tool · closed-form · ±10%</p>
    <h1 class="hero-title">Loading Coil</h1>
    <p class="sub">
      {posLabel.charAt(0) + posLabel.slice(1).toLowerCase()}-loaded · {fmt(fMHz, 3)} MHz
    </p>
  </div>
  <div class="acts">
    <button class="btn ghost" onclick={share}>Share link</button>
    <button class="btn ghost" onclick={saveProject}>Save</button>
  </div>
</header>

<!-- readout strip -->
<section class="readout">
  <div class="cell lead"><div class="k">Required L</div><div class="v tnum">{readL}{#if result.ok}<small>µH</small>{/if}</div></div>
  <div class="cell" class:dim={!result.ok}><div class="k">Turns N</div><div class="v tnum">{readN}</div></div>
  <div class="cell"><div class="k">Zc <span class="tag">exposed</span></div><div class="v tnum">{readZc}{#if result.ok}<small>Ω</small>{/if}</div></div>
  <div class="cell" class:warned={lowQ} class:dim={!result.ok}>
    {#if lowQ}<span class="warnbadge">LOW</span>{/if}
    <div class="k">Q <span class="tag est">est</span></div><div class="v tnum">{readQ}</div>
  </div>
  <div class="cell" class:warned={nearFs} class:dim={!result.ok}>
    {#if nearFs}<span class="warnbadge">NEAR f</span>{/if}
    <div class="k">f-self <span class="tag est">est</span></div><div class="v tnum">{readFs}{#if result.ok}<small>MHz</small>{/if}</div>
  </div>
</section>

<!-- status bar -->
<div class="statusbar">
  <span class="chip {status.kind}">{status.kind === 'block' ? 'BLOCK' : status.kind === 'warn' ? 'WARN' : 'OK'}</span>
  <span class="statusmsg">{@html status.msg}</span>
</div>

<div class="grid">
  <!-- controls -->
  <aside class="controls">
    <div class="stagelabel"><span>Stage 1 · electrical</span><span class="n">→ L</span></div>

    <div class="field">
      <label for="f">Design frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
      <div class="presets">
        {#each BAND_PRESETS as b}
          <button type="button" class="preset" class:on={Math.abs(fMHz - b.fMHz) < 1e-6} onclick={() => (fMHz = b.fMHz)}>{b.band}</button>
        {/each}
      </div>
    </div>

    <div class="field">
      <span class="lbl">Loading position</span>
      <div class="seg" role="group" aria-label="Loading position">
        <button type="button" aria-pressed={posSel === 'base'} onclick={() => (posSel = 'base')}>Base</button>
        <button type="button" aria-pressed={posSel === 'center'} onclick={() => (posSel = 'center')}>Center</button>
        <button type="button" aria-pressed={posSel === 'custom'} onclick={() => (posSel = 'custom')}>Height</button>
      </div>
      {#if posSel === 'custom'}
        <div class="ipt hgt"><input class="tnum" inputmode="decimal" min="0" max="0.99" step="0.05" bind:value={posFrac} aria-label="Height fraction" /><span class="u">×H</span></div>
      {/if}
    </div>

    <div class="field">
      <label for="H">Radiator height H</label>
      <div class="ipt"><input id="H" class="tnum" inputmode="decimal" bind:value={Hd} /><span class="u">{lu}</span></div>
    </div>
    <div class="field">
      <label for="a">Conductor radius a</label>
      <div class="ipt"><input id="a" class="tnum" inputmode="decimal" bind:value={ad} /><span class="u">{cu}</span></div>
    </div>
    <div class="field">
      <label for="vf">Velocity factor</label>
      <div class="ipt"><input id="vf" class="tnum" inputmode="decimal" bind:value={vf} /><span class="u">VF</span></div>
      <div class="presets">
        <button type="button" class="preset" class:on={vf === VF_BARE} onclick={() => (vf = VF_BARE)}>bare 0.96</button>
        <button type="button" class="preset" class:on={vf === VF_PVC} onclick={() => (vf = VF_PVC)}>PVC 0.94</button>
      </div>
    </div>

    <div class="stagelabel"><span>Stage 2 · geometry</span><span class="n">solve</span></div>
    <div class="field">
      <span class="lbl">Solve for</span>
      <div class="seg" role="group" aria-label="Solve target">
        <button type="button" aria-pressed={mode === 'N'} onclick={() => setMode('N')}>N</button>
        <button type="button" aria-pressed={mode === 'd'} onclick={() => setMode('d')}>d</button>
        <button type="button" aria-pressed={mode === 'len'} onclick={() => setMode('len')}>ℓ</button>
      </div>
      <p class="solvenote">
        {mode === 'N' ? 'fixing d, ℓ → solving turns' : mode === 'd' ? 'fixing N, ℓ → solving diameter' : 'fixing N, d → solving length'}
      </p>
    </div>

    <div class="field">
      <label for="N">Turns N</label>
      <div class="ipt" class:output={mode === 'N'}>
        <input id="N" class="tnum" inputmode="decimal" readonly={mode === 'N'} value={mode === 'N' ? outN : Nin} oninput={(e) => (Nin = Number((e.target as HTMLInputElement).value))} />
        <span class="u">t</span>{#if mode === 'N'}<span class="outtag">SOLVED</span>{/if}
      </div>
    </div>
    <div class="field">
      <label for="d">Form diameter d</label>
      <div class="ipt" class:output={mode === 'd'}>
        <input id="d" class="tnum" inputmode="decimal" readonly={mode === 'd'} value={mode === 'd' ? outD : dd} oninput={(e) => (dd = Number((e.target as HTMLInputElement).value))} />
        <span class="u">{cu}</span>{#if mode === 'd'}<span class="outtag">SOLVED</span>{/if}
      </div>
    </div>
    <div class="field">
      <label for="len">Coil length ℓ</label>
      <div class="ipt" class:output={mode === 'len'}>
        <input id="len" class="tnum" inputmode="decimal" readonly={mode === 'len'} value={mode === 'len' ? outLen : lend} oninput={(e) => (lend = Number((e.target as HTMLInputElement).value))} />
        <span class="u">{cu}</span>{#if mode === 'len'}<span class="outtag">SOLVED</span>{/if}
      </div>
    </div>
    <div class="field">
      <label for="wire">Wire</label>
      <div class="ipt"><input id="wire" class="tnum" inputmode="decimal" bind:value={wireIn} /><span class="u">{wireUnitLabel}</span></div>
      {#if units === 'imperial'}
        <div class="presets">
          {#each COMMON_AWG as g}
            <button type="button" class="preset" class:on={Math.round(wireIn) === g} onclick={() => (wireIn = g)}>#{g}</button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="stagelabel"><span>Units</span></div>
    <div class="seg" role="group" aria-label="Units">
      <button type="button" aria-pressed={units === 'metric'} onclick={() => setUnits('metric')}>Metric</button>
      <button type="button" aria-pressed={units === 'imperial'} onclick={() => setUnits('imperial')}>Imperial</button>
    </div>
  </aside>

  <!-- hero -->
  <section class="hero">
    <div class="heroTop">
      <span class="t">Wound coil — single-layer air core</span>
      <span class="g tnum">d {result.ok ? outD : '—'}{cu} · ℓ {result.ok ? outLen : '—'}{cu} · N {result.ok ? outN : '—'}</span>
    </div>

    <div class="stage" class:blocked={!result.ok}>
      <svg viewBox="0 0 620 200" role="img" aria-label="Loading coil schematic diagram">
        <line x1="40" y1="100" x2="580" y2="100" stroke="var(--rule-strong)" stroke-width="1" stroke-dasharray="4 4" />
        <!-- leads -->
        <line x1="40" y1="100" x2={coilExtent.x0} y2="100" stroke="var(--ink)" stroke-width="2" />
        <line x1={coilExtent.x1} y1="100" x2="580" y2="100" stroke="var(--ink)" stroke-width="2" />
        <g fill="none" stroke-width="2">
          {#each coilTurns as t}
            <ellipse cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry} stroke={t.mid ? 'var(--signal)' : 'var(--ink)'} />
          {/each}
        </g>
        {#if result.ok}
          <!-- N leader -->
          <line x1={(coilExtent.x0 + coilExtent.x1) / 2} y1="56" x2={(coilExtent.x0 + coilExtent.x1) / 2} y2="42" stroke="var(--signal)" stroke-width="1.5" stroke-dasharray="2 3" />
          <text x={(coilExtent.x0 + coilExtent.x1) / 2} y="34" text-anchor="middle" fill="var(--signal)" font-family="var(--mono)" font-size="12" font-weight="700">N = {outN} t</text>
          <!-- ℓ dimension -->
          <line x1={coilExtent.x0} y1="150" x2={coilExtent.x1} y2="150" stroke="var(--ink-2)" stroke-width="1" />
          <line x1={coilExtent.x0} y1="145" x2={coilExtent.x0} y2="155" stroke="var(--ink-2)" stroke-width="1" />
          <line x1={coilExtent.x1} y1="145" x2={coilExtent.x1} y2="155" stroke="var(--ink-2)" stroke-width="1" />
          <text x={(coilExtent.x0 + coilExtent.x1) / 2} y="168" text-anchor="middle" fill="var(--ink)" font-family="var(--mono)" font-size="12">ℓ = {outLen} {cu}</text>
          <!-- d dimension -->
          <text x={coilExtent.x0 - 8} y="104" text-anchor="end" fill="var(--ink-2)" font-family="var(--mono)" font-size="11">d {outD}</text>
        {/if}
        <text x="52" y="20" fill="var(--ink-2)" font-family="var(--mono)" font-size="10">FIG.1 · {posLabel} LOADED</text>
      </svg>
      {#if !result.ok}
        <div class="blockoverlay">
          <div class="bx">
            <div class="bt">{status.kind === 'block' ? status.title : ''}</div>
            <div class="bm">{@html status.msg}</div>
          </div>
        </div>
      {/if}
    </div>

    <!-- reactance balance beam -->
    <div class="beam" class:blocked={!beam}>
      <span class="t">Reactance balance — Σ jX at the coil</span>
      <span class="sum">{beam ? 'Σ jX = 0 Ω  ✓ resonant' : 'no coil required'}</span>
      <div class="axis">
        <div class="zero"></div>
        {#if beam}
          {#each beam.bars as b, i}
            {@const h = (Math.abs(b.v) / beam.max) * 30}
            <div class="bar {b.cls}" style={`left:${70 + i * 74}px; ${b.v < 0 ? `top:35px;height:${h}px` : `top:${35 - h}px;height:${h}px`}`}>
              <span class="bl" style={b.v < 0 ? 'top:calc(100% + 3px)' : 'bottom:calc(100% + 3px)'}>{b.n}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- section reactance table + honesty pair -->
    {#if result.ok}
      <div class="detail">
        <table class="data">
          <thead><tr><th>Section</th><th>β·ℓ</th><th>reactance</th></tr></thead>
          <tbody>
            <tr><td>lower</td><td>{fmt(result.values.betaLowerDeg, 1)}°</td><td>{fmt(result.values.xLowerOhm, 0)} Ω</td></tr>
            <tr><td>upper</td><td>{fmt(result.values.betaUpperDeg, 1)}°</td><td>{fmt(result.values.xUpperOhm, 0)} Ω</td></tr>
            <tr><td>coil</td><td>—</td><td class="sig">+{fmt(result.values.xReqOhm, 0)} Ω</td></tr>
          </tbody>
        </table>
        <div class="accuracy">
          <span class="lab">Accuracy note</span><br />
          ±~10%, average-Zc approximation — trim to resonance.
          <div class="badges">
            <span class="badge">Method <b>closed-form</b></span>
            <span class="badge">Cite <b>ARRL / Kraus · Nagaoka</b></span>
            <span class="badge">Zc <b>60·[ln(2H/a)−1]</b></span>
          </div>
        </div>
      </div>
    {/if}
  </section>
</div>

{#if saves.length}
  <div class="saves">
    <span class="saveslab">Saved designs</span>
    {#each saves as s}
      <span class="savechip">
        <button type="button" class="open" onclick={() => openSave(s.qs)}>{s.name}</button>
        <button type="button" class="del" aria-label={`Delete ${s.name}`} onclick={() => deleteSave(s.name)}>×</button>
      </span>
    {/each}
  </div>
{/if}

{#if toast}<div class="toast" role="status">{toast}</div>{/if}

<style>
  .mast {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    border-bottom: 2px solid var(--ink);
    padding: 18px 0 10px;
    flex-wrap: wrap;
  }
  .kicker {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--signal-ink);
    margin: 0 0 4px;
  }
  .mast .sub {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--ink-2);
    margin-top: 4px;
  }
  .acts {
    display: flex;
    gap: 8px;
  }

  .readout {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border: 1px solid var(--rule-strong);
    border-top: none;
  }
  .cell {
    padding: 11px 13px;
    border-left: 1px solid var(--rule);
    position: relative;
  }
  .cell:first-child {
    border-left: none;
  }
  .cell.lead {
    background: var(--sunk);
  }
  .cell .k {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-2);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .cell .k .tag {
    font-size: 8px;
    letter-spacing: 0.08em;
    color: var(--signal-ink);
    border: 1px solid var(--rule-strong);
    padding: 0 3px;
  }
  .cell .k .tag.est {
    color: var(--ink-3);
  }
  .cell .v {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    font-size: 22px;
    font-weight: 600;
    margin-top: 3px;
  }
  .cell.lead .v {
    color: var(--signal-ink);
  }
  .cell .v small {
    font-size: 12px;
    color: var(--ink-2);
    font-weight: 500;
    margin-left: 2px;
  }
  .cell.dim .v {
    color: var(--ink-3);
  }
  .warnbadge {
    position: absolute;
    top: 8px;
    right: 10px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--signal-ink);
    border: 1px solid var(--signal);
    background: var(--signal-soft);
    padding: 1px 4px;
  }

  .statusbar {
    display: flex;
    align-items: center;
    gap: 11px;
    border: 1px solid var(--rule-strong);
    border-top: none;
    padding: 10px 13px;
    font-size: 13.5px;
  }
  .statusmsg {
    color: var(--ink-2);
  }

  .grid {
    display: grid;
    grid-template-columns: 290px 1fr;
    border: 1px solid var(--rule-strong);
    border-top: none;
  }
  .controls {
    border-right: 1px solid var(--rule);
    padding: 15px;
    background: var(--panel);
  }
  .stagelabel {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink-2);
    border-bottom: 1px solid var(--rule);
    padding-bottom: 5px;
    margin: 16px 0 11px;
    display: flex;
    justify-content: space-between;
  }
  .stagelabel:first-child {
    margin-top: 0;
  }
  .stagelabel .n {
    color: var(--signal-ink);
  }
  .field {
    margin-bottom: 11px;
  }
  .field .lbl {
    display: block;
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    color: var(--ink-2);
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .ipt.hgt {
    margin-top: 6px;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 6px;
  }
  .preset {
    font-family: var(--mono);
    font-size: 10.5px;
    background: var(--paper);
    color: var(--ink-2);
    border: 1px solid var(--rule);
    padding: 3px 6px;
    cursor: pointer;
  }
  .preset:hover {
    border-color: var(--ink-2);
    color: var(--ink);
  }
  .preset.on {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .solvenote {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-3);
    margin: 5px 0 0;
  }

  .hero {
    padding: 16px 18px;
  }
  .heroTop {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .heroTop .t {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .heroTop .g {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--ink);
  }
  .stage {
    position: relative;
    background:
      linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 100% 22px,
      linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 22px 100%, var(--panel);
    border: 1px solid var(--rule);
    padding: 12px;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .stage.blocked svg {
    opacity: 0.28;
  }
  .blockoverlay {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--critical-soft) 82%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;
  }
  .blockoverlay .bx {
    max-width: 360px;
  }
  .blockoverlay .bt {
    font-family: var(--display);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--critical);
  }
  .blockoverlay .bm {
    font-size: 13px;
    color: var(--ink);
    margin-top: 6px;
  }

  .beam {
    padding: 14px 18px 8px;
  }
  .beam .t {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .beam .sum {
    font-family: var(--mono);
    font-size: 12.5px;
    float: right;
    color: var(--ok);
  }
  .beam.blocked .sum {
    color: var(--ink-3);
  }
  .axis {
    position: relative;
    height: 74px;
    border-left: 1px solid var(--rule-strong);
    margin-top: 26px;
  }
  .zero {
    position: absolute;
    left: 0;
    right: 0;
    top: 35px;
    border-top: 1px solid var(--ink);
  }
  .bar {
    position: absolute;
    width: 60px;
    box-sizing: border-box;
  }
  .bar.cap {
    background: repeating-linear-gradient(-45deg, var(--rule-strong) 0 1px, transparent 1px 5px);
    border: 1px solid var(--rule-strong);
  }
  .bar.ind {
    background: var(--signal-soft);
    border: 1px solid var(--signal);
  }
  .bar .bl {
    position: absolute;
    left: -6px;
    right: -6px;
    text-align: center;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-2);
  }

  .detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 10px;
  }

  .saves {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .saveslab {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .savechip {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
  }
  .savechip .open {
    font-family: var(--mono);
    font-size: 12px;
    background: var(--panel);
    color: var(--ink);
    border: none;
    padding: 4px 9px;
    cursor: pointer;
  }
  .savechip .del {
    border: none;
    border-left: 1px solid var(--rule);
    background: var(--panel);
    color: var(--ink-3);
    padding: 4px 8px;
    cursor: pointer;
  }
  .savechip .del:hover {
    color: var(--critical);
  }

  .toast {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--ink);
    color: var(--paper);
    font-family: var(--mono);
    font-size: 12px;
    padding: 8px 16px;
    z-index: 50;
  }

  @media (max-width: 780px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .controls {
      border-right: none;
      border-bottom: 1px solid var(--rule);
    }
    .readout {
      grid-template-columns: repeat(2, 1fr);
    }
    .cell:nth-child(3) {
      border-left: none;
    }
    .detail {
      grid-template-columns: 1fr;
    }
  }
</style>
