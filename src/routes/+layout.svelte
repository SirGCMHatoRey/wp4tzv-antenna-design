<script lang="ts">
  import '../app.css';
  import Masthead from '$lib/components/Masthead.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<a class="skip" href="#main">Skip to content</a>
<Masthead />
<main id="main" class="container">
  {@render children()}
</main>
<Footer />

<style>
  main {
    padding-top: 8px;
    padding-bottom: 70px;
    min-height: 60vh;
  }
  .skip {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 100;
    background: var(--ink);
    color: var(--paper);
    padding: 8px 14px;
    font-family: var(--mono);
    font-size: 12px;
  }
  .skip:focus {
    left: 8px;
    top: 8px;
  }
</style>
