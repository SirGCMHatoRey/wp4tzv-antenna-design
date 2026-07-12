<script lang="ts">
  import { SITE } from '$lib/site';
  // Region selector lives in the footer (CONTEXT: Region is the top-level geographic
  // scope for band data; Region 2 / Americas is the default per the band data model).
  let region = $state('2');
</script>

<footer>
  <div class="row container">
    <span>{SITE.titleSuffix} · datasheet system v1</span>
    <label class="region">
      <span class="lab">Region</span>
      <select bind:value={region} aria-label="IARU Region">
        <option value="2">Region 2 · Americas</option>
        <option value="1">Region 1 · EMEA</option>
        <option value="3">Region 3 · APAC</option>
      </select>
    </label>
    <span class="muted">Client-side math · no accounts · works offline</span>
  </div>
</footer>

<style>
  footer {
    border-top: 2px solid var(--ink);
    margin-top: 44px;
  }
  .row {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink-2);
  }
  .region {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .region .lab {
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .muted {
    color: var(--ink-3);
  }
</style>
