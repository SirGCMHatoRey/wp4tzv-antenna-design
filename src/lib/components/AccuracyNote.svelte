<script lang="ts">
  // The honesty pair (ADR-0002 / ADR-0005): the Accuracy Note + Method/Cite badges.
  // Present on every approximating calculator; the anti-magic-number signature.
  import type { Snippet } from 'svelte';
  interface Props {
    method?: string;
    cite?: string;
    children: Snippet;
  }
  let { method, cite, children }: Props = $props();
</script>

<div class="accuracy">
  <span class="lab">Accuracy note</span><br />
  {@render children()}
  {#if method || cite}
    <div class="badges">
      {#if method}<span class="badge">Method <b>{method}</b></span>{/if}
      {#if cite}<span class="badge">Cite <b>{cite}</b></span>{/if}
    </div>
  {/if}
</div>
