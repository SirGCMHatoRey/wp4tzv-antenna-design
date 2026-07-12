<script lang="ts">
  import { pageTitle } from '$lib/site';
  import { computeResonantFrequency, type ResMode } from '$lib/tools/resonant-frequency/engine';
  import { units } from '$lib/stores/app-state';
  import { fmt } from '$lib/format';

  let mode = $state<ResMode>('lc');
  let LuH = $state(1); // µH
  let CpF = $state(100); // pF
  let lenM = $state(20);
  let lenFt = $state(65.6);
  let k = $state(0.95);

  const imperial = $derived($units === 'ft');
  const lenMeters = $derived(imperial ? Number(lenFt) / 3.280839895 : Number(lenM));

  const r = $derived(
    computeResonantFrequency({
      mode,
      L: Number(LuH) * 1e-6,
      C: Number(CpF) * 1e-12,
      lenM: lenMeters,
      k: Number(k)
    })
  );
</script>

<svelte:head><title>{pageTitle('Resonant Frequency')}</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · exact</p>
  <h1 class="hero-title">Resonant Frequency</h1>
  <p class="formula tnum">f = 1 / (2π√(LC)) &nbsp;·&nbsp; or f = c·k / (2ℓ)</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <span class="lbl" style="display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;color:var(--ink-2);margin-bottom:4px">From</span>
      <div class="seg" role="group" aria-label="Input mode">
        <button type="button" aria-pressed={mode === 'lc'} onclick={() => (mode = 'lc')}>L · C</button>
        <button type="button" aria-pressed={mode === 'length'} onclick={() => (mode = 'length')}>Length</button>
      </div>
    </div>

    {#if mode === 'lc'}
      <div class="field">
        <label for="L">Inductance L</label>
        <div class="ipt"><input id="L" class="tnum" inputmode="decimal" bind:value={LuH} /><span class="u">µH</span></div>
      </div>
      <div class="field">
        <label for="C">Capacitance C</label>
        <div class="ipt"><input id="C" class="tnum" inputmode="decimal" bind:value={CpF} /><span class="u">pF</span></div>
      </div>
      <p class="toolnote">Series/parallel LC tank resonance.</p>
    {:else}
      <div class="field">
        <label for="len">Element length ℓ</label>
        {#if imperial}
          <div class="ipt"><input id="len" class="tnum" inputmode="decimal" bind:value={lenFt} /><span class="u">ft</span></div>
        {:else}
          <div class="ipt"><input id="len" class="tnum" inputmode="decimal" bind:value={lenM} /><span class="u">m</span></div>
        {/if}
      </div>
      <div class="field">
        <label for="k">Correction factor k</label>
        <div class="ipt"><input id="k" class="tnum" inputmode="decimal" bind:value={k} /><span class="u">k</span></div>
      </div>
      <p class="toolnote">Half-wave resonance of a physical element. k ≈ 0.95 for a real wire dipole.</p>
    {/if}
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">Resonant frequency</div><div class="v tnum">{fmt(r.fMHz, 4)}<small>MHz</small></div></div>
    </div>
  </section>
</div>
