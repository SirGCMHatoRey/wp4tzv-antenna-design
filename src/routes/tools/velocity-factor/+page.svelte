<script lang="ts">
  import { computeVelocityFactor, MATERIALS, type VfMode } from '$lib/tools/velocity-factor/engine';
  import { fmt } from '$lib/format';

  let mode = $state<VfMode>('lengths');
  let physical = $state(20);
  let electrical = $state(30);
  let material = $state(MATERIALS[3].vf); // RG-58 family

  const r = $derived(
    computeVelocityFactor({
      mode,
      physical: Number(physical),
      electrical: Number(electrical),
      material: Number(material)
    })
  );
</script>

<svelte:head><title>Velocity Factor — Antenna Design Portal</title></svelte:head>

<header class="thead">
  <p class="kicker">Engineering Tool · exact</p>
  <h1 class="hero-title">Velocity Factor</h1>
  <p class="formula tnum">VF = v / c = physical length / electrical length</p>
</header>

<div class="tgrid">
  <aside class="tcontrols">
    <div class="field">
      <span class="lbl" style="display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;color:var(--ink-2);margin-bottom:4px">From</span>
      <div class="seg" role="group" aria-label="Input mode">
        <button type="button" aria-pressed={mode === 'lengths'} onclick={() => (mode = 'lengths')}>Lengths</button>
        <button type="button" aria-pressed={mode === 'material'} onclick={() => (mode = 'material')}>Material</button>
      </div>
    </div>

    {#if mode === 'lengths'}
      <div class="field">
        <label for="phys">Physical length</label>
        <div class="ipt"><input id="phys" class="tnum" inputmode="decimal" bind:value={physical} /><span class="u">any</span></div>
      </div>
      <div class="field">
        <label for="elec">Electrical length</label>
        <div class="ipt"><input id="elec" class="tnum" inputmode="decimal" bind:value={electrical} /><span class="u">same</span></div>
      </div>
      <p class="toolnote">Use the same unit for both. Physical is the cut length; electrical is the free-space length for that frequency.</p>
    {:else}
      <div class="field">
        <label for="mat">Material</label>
        <select id="mat" bind:value={material} style="width:100%">
          {#each MATERIALS as m}<option value={m.vf}>{m.name} — {m.vf}</option>{/each}
        </select>
      </div>
      <p class="toolnote">Typical published velocity factors. Always verify against your cable's datasheet.</p>
    {/if}
  </aside>

  <section class="treadout">
    <div class="rcells">
      <div class="rbig"><div class="k">Velocity factor</div><div class="v tnum">{fmt(r.vf, 3)}</div></div>
    </div>
    <p class="toolnote">Feeds the Wavelength, Loading Coil, and feed-line tools. A component of, not the same as, the antenna correction factor k.</p>
  </section>
</div>
