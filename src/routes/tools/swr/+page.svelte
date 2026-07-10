<script lang="ts">
  import { computeSwr, type SwrMode } from '$lib/tools/swr/engine';
  import { fmt } from '$lib/format';

  let mode = $state<SwrMode>('impedance');
  let z0 = $state(50);
  let rLoad = $state(75);
  let xLoad = $state(0);
  let pFwd = $state(100);
  let pRev = $state(5);

  const r = $derived(
    computeSwr({
      mode,
      z0: Number(z0),
      r: Number(rLoad),
      x: Number(xLoad),
      pFwd: Number(pFwd),
      pRev: Number(pRev)
    })
  );
  const inf = (n: number, dp: number) => (Number.isFinite(n) ? fmt(n, dp) : '∞');
</script>

<svelte:head><title>SWR — Antenna Design Portal</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · exact</p>
  <h1 class="hero-title">SWR</h1>
  <p class="formula tnum">SWR = (1 + |Γ|) / (1 − |Γ|) &nbsp;·&nbsp; Γ = (Z − Z₀)/(Z + Z₀)</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <span class="lbl" style="display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;color:var(--ink-2);margin-bottom:4px">From</span>
      <div class="seg" role="group" aria-label="Input mode">
        <button type="button" aria-pressed={mode === 'impedance'} onclick={() => (mode = 'impedance')}>Impedance</button>
        <button type="button" aria-pressed={mode === 'power'} onclick={() => (mode = 'power')}>Power</button>
      </div>
    </div>

    {#if mode === 'impedance'}
      <div class="field">
        <label for="z0">Line impedance Z₀</label>
        <div class="ipt"><input id="z0" class="tnum" inputmode="decimal" bind:value={z0} /><span class="u">Ω</span></div>
      </div>
      <div class="field">
        <label for="r">Load resistance R</label>
        <div class="ipt"><input id="r" class="tnum" inputmode="decimal" bind:value={rLoad} /><span class="u">Ω</span></div>
      </div>
      <div class="field">
        <label for="x">Load reactance X</label>
        <div class="ipt"><input id="x" class="tnum" inputmode="decimal" bind:value={xLoad} /><span class="u">jΩ</span></div>
      </div>
      <p class="toolnote">X may be negative (capacitive). Set X = 0 for a purely resistive load.</p>
    {:else}
      <div class="field">
        <label for="pf">Forward power</label>
        <div class="ipt"><input id="pf" class="tnum" inputmode="decimal" bind:value={pFwd} /><span class="u">W</span></div>
      </div>
      <div class="field">
        <label for="pr">Reflected power</label>
        <div class="ipt"><input id="pr" class="tnum" inputmode="decimal" bind:value={pRev} /><span class="u">W</span></div>
      </div>
      <p class="toolnote">From a directional wattmeter. Units cancel — any consistent power unit works.</p>
    {/if}
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">SWR</div><div class="v tnum">{inf(r.swr, 2)} : 1</div></div>
      <div class="rrow">
        <div class="rbig"><div class="k">|Γ| reflection</div><div class="v tnum">{fmt(r.gammaMag, 3)}</div></div>
        <div class="rbig"><div class="k">Return loss</div><div class="v tnum">{inf(r.returnLossDb, 2)}<small>dB</small></div></div>
        <div class="rbig"><div class="k">Mismatch loss</div><div class="v tnum">{inf(r.mismatchLossDb, 2)}<small>dB</small></div></div>
      </div>
    </div>
  </section>
</div>
