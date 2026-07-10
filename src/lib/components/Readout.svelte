<script lang="ts">
  // Numbers-first readout strip. First cell is the lead (signal-inked) result.
  interface Cell {
    key: string;
    value: string;
    unit?: string;
  }
  interface Props {
    cells: Cell[];
  }
  let { cells }: Props = $props();
</script>

<div class="readout" style={`grid-template-columns:repeat(${cells.length},1fr)`}>
  {#each cells as c, i}
    <div class="rcell" class:lead={i === 0}>
      <div class="k">{c.key}</div>
      <div class="v tnum">{c.value}{#if c.unit}<small>{c.unit}</small>{/if}</div>
    </div>
  {/each}
</div>
