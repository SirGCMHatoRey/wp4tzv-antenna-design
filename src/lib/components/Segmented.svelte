<script lang="ts">
  // Segmented control — e.g. solve-mode (which variable is the computed output).
  interface Option {
    value: string;
    label: string;
  }
  interface Props {
    options: Option[];
    value?: string;
    ariaLabel?: string;
    onchange?: (value: string) => void;
  }
  let { options, value = $bindable(options[0]?.value), ariaLabel = 'Options', onchange }: Props =
    $props();

  function pick(v: string) {
    value = v;
    onchange?.(v);
  }
</script>

<div class="seg" role="group" aria-label={ariaLabel}>
  {#each options as opt}
    <button type="button" aria-pressed={value === opt.value} onclick={() => pick(opt.value)}>
      {opt.label}
    </button>
  {/each}
</div>
