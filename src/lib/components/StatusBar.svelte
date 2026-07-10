<script lang="ts">
  // ok / warn / block status bar. Maps to the ADR-0008 Result union:
  // ok:true no warnings -> ok; ok:true w/ warnings -> warn; ok:false -> block.
  import type { Snippet } from 'svelte';
  interface Props {
    kind: 'ok' | 'warn' | 'block';
    children: Snippet;
  }
  let { kind, children }: Props = $props();
  const labels = { ok: 'OK', warn: 'WARN', block: 'BLOCK' } as const;
</script>

<div class="status" role={kind === 'block' ? 'alert' : 'status'}>
  <span class="chip {kind}">{labels[kind]}</span>
  <span class="m">{@render children()}</span>
</div>
