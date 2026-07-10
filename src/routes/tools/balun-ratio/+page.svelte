<script lang="ts">
  import { computeBalunRatio } from '$lib/tools/balun-ratio/engine';
  import { fmt } from '$lib/format';

  let zIn = $state(50);
  let zOut = $state(200);
  const r = $derived(computeBalunRatio({ zIn: Number(zIn), zOut: Number(zOut) }));
</script>

<svelte:head><title>Balun Ratio — Antenna Design Portal</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · exact</p>
  <h1 class="hero-title">Balun Ratio</h1>
  <p class="formula tnum">n = √(Z_out / Z_in)</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <label for="zin">Input impedance Z_in</label>
      <div class="ipt"><input id="zin" class="tnum" inputmode="decimal" bind:value={zIn} /><span class="u">Ω</span></div>
    </div>
    <div class="field">
      <label for="zout">Output impedance Z_out</label>
      <div class="ipt"><input id="zout" class="tnum" inputmode="decimal" bind:value={zOut} /><span class="u">Ω</span></div>
    </div>
    <p class="toolnote">A 4:1 impedance ratio is a 2:1 turns ratio. Common baluns: 1:1 (50→50), 4:1 (50→200), 9:1 (50→450).</p>
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">Impedance ratio</div><div class="v tnum">{r.label}</div></div>
      <div class="rrow">
        <div class="rbig"><div class="k">Turns ratio</div><div class="v tnum">{fmt(r.turnsRatio, 3)} : 1</div></div>
        <div class="rbig"><div class="k">Z_out / Z_in</div><div class="v tnum">{fmt(r.impedanceRatio, 3)}</div></div>
      </div>
    </div>
  </section>
</div>
