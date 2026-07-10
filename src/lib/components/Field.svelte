<script lang="ts">
  // Input + unit. Set `solved` to render the dashed read-only SOLVED output
  // variant (ADR-0008: the computed variable in a solve-mode tool).
  interface Props {
    label: string;
    unit?: string;
    value?: string | number;
    solved?: boolean;
    inputmode?: 'decimal' | 'numeric' | 'text';
    id?: string;
    oninput?: (e: Event) => void;
  }
  let {
    label,
    unit = '',
    value = $bindable(''),
    solved = false,
    inputmode = 'decimal',
    id = undefined,
    oninput = undefined
  }: Props = $props();
</script>

<div class="field">
  <label for={id}>{label}</label>
  <div class="ipt" class:output={solved}>
    <input {id} {inputmode} class="tnum" bind:value readonly={solved} {oninput} />
    {#if unit}<span class="u">{unit}</span>{/if}
    {#if solved}<span class="outtag">SOLVED</span>{/if}
  </div>
</div>
