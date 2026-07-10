<script lang="ts">
  import { computeBandwidth, Q_PRESETS } from '$lib/tools/bandwidth/engine';
  import { centerFreqMHz } from '$lib/stores/app-state';
  import { fmt } from '$lib/format';

  let fMHz = $state($centerFreqMHz);
  let q = $state(13);
  let targetSwr = $state(2);

  const r = $derived(
    computeBandwidth({ fMHz: Number(fMHz), q: Number(q), targetSwr: Number(targetSwr) })
  );
</script>

<svelte:head><title>Bandwidth — Antenna Design Portal</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · closed-form · advisory</p>
  <h1 class="hero-title">Bandwidth</h1>
  <p class="formula tnum">BW = (f / Q) · (SWR − 1) / √SWR</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="f">Design frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="q">Loaded Q</label>
      <div class="ipt"><input id="q" class="tnum" inputmode="decimal" bind:value={q} /><span class="u">Q</span></div>
      <div class="presets">
        {#each Q_PRESETS as p}
          <button type="button" class="preset" class:on={q === p.q} onclick={() => (q = p.q)}>{p.name}</button>
        {/each}
      </div>
    </div>
    <div class="field">
      <label for="swr">Target SWR</label>
      <div class="ipt"><input id="swr" class="tnum" inputmode="decimal" min="1.01" bind:value={targetSwr} /><span class="u">: 1</span></div>
    </div>
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">{fmt(targetSwr, 1)}:1 SWR bandwidth</div><div class="v tnum">{fmt(r.bwMHz * 1000, 0)}<small>kHz</small></div></div>
      <div class="rrow">
        <div class="rbig"><div class="k">Lower edge</div><div class="v tnum">{fmt(r.fLowMHz, 3)}<small>MHz</small></div></div>
        <div class="rbig"><div class="k">Upper edge</div><div class="v tnum">{fmt(r.fHighMHz, 3)}<small>MHz</small></div></div>
        <div class="rbig"><div class="k">Fractional</div><div class="v tnum">{fmt(r.fractionalPct, 2)}<small>%</small></div></div>
      </div>
    </div>

    <div class="accuracy">
      <span class="lab">Accuracy note</span><br />
      Single-resonance (lumped RLC) approximation. A real antenna's bandwidth depends on its exact
      geometry and environment; use this as a first estimate, not a spec. Half-power (−3 dB) BW = f/Q
      = {fmt(r.bw3dbMHz * 1000, 0)} kHz.
      <div class="badges">
        <span class="badge">Method <b>closed-form</b></span>
        <span class="badge">Cite <b>ARRL Antenna Book</b></span>
      </div>
    </div>
  </section>
</div>
