<script lang="ts">
  // Shared blueprint-grid canvas frame: coil, antenna geometry, SWR curves mount here.
  import type { Snippet } from 'svelte';
  interface Props {
    tag?: string;
    height?: number;
    children?: Snippet;
  }
  let { tag = 'FIG.1', height = 220, children }: Props = $props();
</script>

<div class="figframe" style={`min-height:${height}px`}>
  <span class="tagf">{tag}</span>
  {#if children}{@render children()}{/if}
</div>
