<script lang="ts">
  import { computeWavelength } from '$lib/tools/wavelength/engine';
  import { units } from '$lib/stores/app-state';
  import { centerFreqMHz } from '$lib/stores/app-state';
  import { lengthDisp } from '$lib/format';
  import { pageTitle } from '$lib/site';

  let fMHz = $state($centerFreqMHz);
  let vf = $state(1);

  const r = $derived(computeWavelength({ fMHz: Number(fMHz), vf: Number(vf) }));
  const imperial = $derived($units === 'ft');
  const L = $derived(lengthDisp(r.lambdaM, imperial));
  const phys = $derived(lengthDisp(r.physM, imperial));
  const half = $derived(lengthDisp(r.halfM, imperial));
  const quarter = $derived(lengthDisp(r.quarterM, imperial));
</script>

<svelte:head><title>{pageTitle('Wavelength')}</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · exact</p>
  <h1 class="hero-title">Wavelength</h1>
  <p class="formula tnum">λ = c / f &nbsp;·&nbsp; physical = λ × VF</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="f">Frequency</label>
      <div class="ipt"><input id="f" class="tnum" inputmode="decimal" bind:value={fMHz} /><span class="u">MHz</span></div>
    </div>
    <div class="field">
      <label for="vf">Velocity factor</label>
      <div class="ipt"><input id="vf" class="tnum" inputmode="decimal" bind:value={vf} /><span class="u">VF</span></div>
    </div>
    <p class="toolnote">VF = 1 gives the free-space wavelength. Set it to your conductor or coax VF for the physical length.</p>
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">Free-space wavelength λ</div><div class="v tnum">{L.value}<small>{L.unit}</small></div></div>
      <div class="rrow">
        <div class="rbig"><div class="k">Physical λ (× VF)</div><div class="v tnum">{phys.value}<small>{phys.unit}</small></div></div>
        <div class="rbig"><div class="k">Half-wave</div><div class="v tnum">{half.value}<small>{half.unit}</small></div></div>
        <div class="rbig"><div class="k">Quarter-wave</div><div class="v tnum">{quarter.value}<small>{quarter.unit}</small></div></div>
      </div>
    </div>
    <p class="toolnote">Length unit follows the site Region/units setting ({imperial ? 'imperial · ft' : 'metric · m'}).</p>
  </section>
</div>
