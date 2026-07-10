<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { theme } from '$lib/stores/theme';
  import { centerFreqMHz } from '$lib/stores/app-state';
  import { antennasByTier, engineeringTools } from '$lib/registry';

  const antennaGroups = antennasByTier();
  const tools = engineeringTools;

  let freqText = $state(String($centerFreqMHz));
  $effect(() => {
    freqText = String($centerFreqMHz);
  });

  function commitFreq() {
    const v = Number(freqText);
    if (Number.isFinite(v) && v > 0) centerFreqMHz.set(v);
    else freqText = String($centerFreqMHz);
  }

  // route.id is base-path-independent (e.g. "/tools/[slug]"), so active-state
  // detection keeps working under a GitHub Pages sub-path.
  const routeId = $derived($page.route.id ?? '');
  const isHome = $derived(routeId === '/');
  const onAntennas = $derived(routeId.startsWith('/antennas'));
  const onTools = $derived(routeId.startsWith('/tools'));
  const onReference = $derived(routeId.startsWith('/reference'));

  let openMenu = $state<'antennas' | 'tools' | null>(null);
  function closeMenus() {
    openMenu = null;
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && closeMenus()} />

<header class="chrome">
  <div class="row container">
    <a class="wordmark" href="{base}/" onclick={closeMenus}>
      Antenna Design<span class="dot">.</span>
    </a>

    <nav class="main" aria-label="Primary">
      <a href="{base}/" aria-current={isHome ? 'page' : undefined}>Home</a>

      <div class="menu" class:open={openMenu === 'antennas'}>
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={openMenu === 'antennas'}
          aria-current={onAntennas ? 'page' : undefined}
          onclick={() => (openMenu = openMenu === 'antennas' ? null : 'antennas')}
        >
          Antennas <span aria-hidden="true">▾</span>
        </button>
        <div class="panel" role="menu" aria-label="Antenna Models">
          {#each antennaGroups as group}
            <p class="grp">{group.label}</p>
            {#each group.models as m}
              <a role="menuitem" href={`${base}/antennas/${m.slug}`} onclick={closeMenus}>{m.name}</a>
            {/each}
          {/each}
          <a role="menuitem" class="all" href="{base}/antennas" onclick={closeMenus}>All Antenna Models →</a>
        </div>
      </div>

      <div class="menu" class:open={openMenu === 'tools'}>
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={openMenu === 'tools'}
          aria-current={onTools ? 'page' : undefined}
          onclick={() => (openMenu = openMenu === 'tools' ? null : 'tools')}
        >
          Tools <span aria-hidden="true">▾</span>
        </button>
        <div class="panel" role="menu" aria-label="Engineering Tools">
          {#each tools as t}
            <a role="menuitem" href={`${base}/tools/${t.slug}`} onclick={closeMenus}>{t.name}</a>
          {/each}
          <a role="menuitem" class="all" href="{base}/tools" onclick={closeMenus}>All Engineering Tools →</a>
        </div>
      </div>

      <a href="{base}/reference" aria-current={onReference ? 'page' : undefined}>Reference</a>
    </nav>

    <div class="cf">
      <label for="cf">Center freq</label>
      <div class="ipt">
        <input
          id="cf"
          class="tnum"
          inputmode="decimal"
          bind:value={freqText}
          onchange={commitFreq}
          onblur={commitFreq}
        />
        <span class="u">MHz</span>
      </div>
      <button
        class="themebtn"
        type="button"
        onclick={() => theme.toggle()}
        aria-label="Toggle light / dark theme"
        title="Toggle theme"
      >
        ◐
      </button>
    </div>
  </div>
</header>

<!-- click-away backdrop when a menu is open -->
{#if openMenu}
  <button class="backdrop" aria-label="Close menu" onclick={closeMenus}></button>
{/if}

<style>
  .chrome {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--paper);
    border-bottom: 2px solid var(--ink);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 10px 20px;
  }
  .wordmark {
    font-family: var(--display);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ink);
    text-decoration: none;
  }
  .wordmark .dot {
    color: var(--signal);
  }

  nav.main {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    align-items: center;
  }
  nav.main a,
  nav.main button {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-2);
    text-decoration: none;
    padding: 6px 10px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
  }
  nav.main a:hover,
  nav.main button:hover {
    color: var(--ink);
    border-color: var(--rule);
  }
  nav.main a[aria-current='page'],
  nav.main button[aria-current='page'] {
    color: var(--ink);
    border-color: var(--rule-strong);
    background: var(--panel);
  }

  .menu {
    position: relative;
    display: inline-flex;
  }
  .panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 280px;
    max-height: min(70vh, 560px);
    overflow-y: auto;
    background: var(--panel);
    border: 1px solid var(--ink);
    padding: 6px 0;
    display: none;
    z-index: 30;
  }
  .menu.open .panel {
    display: block;
  }
  .panel .grp {
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--signal-ink);
    margin: 8px 0 2px;
    padding: 0 14px;
  }
  .panel a {
    display: block;
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--body);
    font-size: 13px;
    color: var(--ink);
    padding: 6px 14px;
    border: none;
  }
  .panel a:hover {
    background: var(--sunk);
    border: none;
  }
  .panel a.all {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--signal-ink);
    border-top: 1px solid var(--rule);
    margin-top: 6px;
    padding-top: 9px;
  }

  .cf {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .cf label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .cf .ipt {
    padding: 4px 7px;
    background: var(--panel);
  }
  .cf .ipt input {
    font-size: 13px;
    width: 64px;
  }
  .cf .u {
    font-size: 11px;
  }
  .themebtn {
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1;
    background: transparent;
    color: var(--ink-2);
    border: 1px solid var(--rule-strong);
    padding: 5px 8px;
    cursor: pointer;
  }
  .themebtn:hover {
    color: var(--ink);
    border-color: var(--ink);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: transparent;
    border: none;
    cursor: default;
  }

  @media (max-width: 720px) {
    nav.main {
      order: 3;
      width: 100%;
    }
    .cf {
      margin-left: auto;
    }
  }
</style>
