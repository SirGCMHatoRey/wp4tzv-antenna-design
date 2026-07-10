<script lang="ts">
  import { computeFeedLineLoss } from '$lib/tools/feed-line-loss/engine';
  import { COAX } from '$lib/tools/feed-line-loss/coax';
  import { units, centerFreqMHz } from '$lib/stores/app-state';
  import { fmt } from '$lib/format';

  const FT_PER_M = 3.280839895013123;
  let cableKey = $state('rg58');
  let lengthDisp = $state(30); // in current unit
  let fMHz = $state($centerFreqMHz);
  let swr = $state(1.5);

  const imperial = $derived($units === 'ft');
  const lengthM = $derived(imperial ? Number(lengthDisp) / FT_PER_M : Number(lengthDisp));
  const lenUnit = $derived(imperial ? 'ft' : 'm');

  const r = $derived(
    computeFeedLineLoss({ cableKey, lengthM, fMHz: Number(fMHz), swr: Number(swr) })
  );
</script>

<svelte:head><title>Feed Line Loss — Antenna Design Portal</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · published-design + closed-form · advisory</p>
  <h1 class="hero-title">Feed Line Loss</h1>
  <p class="formula tnum">matched: α = k₁√f + k₂f &nbsp;·&nbsp; total under SWR (ARRL)</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="cable">Cable</label>
      <select id="cable" bind:value={cableKey} style="width:100%">
        {#each COAX as c}<option value={c.key}>{c.name} · {c.z0} Ω</option>{/each}
      </select>
    </div>
    <div class="field">
      <label for="len">Length</label>
      <div class="ipt"><input id="len" class="tnum" inputmode="decimal" bind:value={lengthDisp} /><span class="u">{lenUnit}</span></div>
    </div>
    <div class="field">
      <label for="f">Frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="swr">SWR at load</label>
      <div class="ipt"><input id="swr" class="tnum" inputmode="decimal" min="1" bind:value={swr} /><span class="u">: 1</span></div>
    </div>
    <p class="toolnote">Set SWR = 1 for the matched loss alone.</p>
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">Total loss (under SWR)</div><div class="v tnum">{fmt(r.totalLossDb, 2)}<small>dB</small></div></div>
      <div class="rrow">
        <div class="rbig"><div class="k">Matched loss</div><div class="v tnum">{fmt(r.matchedLossDb, 2)}<small>dB</small></div></div>
        <div class="rbig"><div class="k">SWR-added loss</div><div class="v tnum">{fmt(r.addedLossDb, 2)}<small>dB</small></div></div>
        <div class="rbig"><div class="k">Power to antenna</div><div class="v tnum">{fmt(r.pctDeliveredSwr, 1)}<small>%</small></div></div>
      </div>
    </div>

    <div class="accuracy">
      <span class="lab">Accuracy note</span><br />
      Matched loss from a two-term fit of published cable curves; SWR-added loss is exact for that
      matched loss. Real loss drifts with age, temperature, and batch — treat as ±10–20%.
      <div class="badges">
        <span class="badge">Method <b>published-design + closed-form</b></span>
        <span class="badge">Cite <b>ARRL Antenna Book · cable datasheets</b></span>
      </div>
    </div>
  </section>
</div>
