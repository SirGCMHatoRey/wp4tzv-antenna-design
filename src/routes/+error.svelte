<script lang="ts">
  import { pageTitle } from '$lib/site';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
</script>

<svelte:head><title>{pageTitle(String($page.status))}</title></svelte:head>

<section class="err">
  <p class="code tnum">{$page.status}</p>
  <h1 class="hero-title">{$page.error?.message ?? 'Something went off-frequency'}</h1>
  <p class="lead">The page you asked for isn't here. Head back to the workbench.</p>
  <a class="btn" href="{base}/">Return home</a>
</section>

<style>
  .err {
    padding: 60px 0;
    max-width: 60ch;
  }
  .code {
    font-family: var(--mono);
    font-size: 13px;
    letter-spacing: 0.2em;
    color: var(--signal-ink);
    margin: 0 0 6px;
  }
  .lead {
    margin: 12px 0 20px;
  }
</style>
