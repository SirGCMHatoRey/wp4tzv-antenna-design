# Datasheet typeface pairing

Type: prototype
Label: wayfinder:prototype
Status: resolved

## Question

Which self-hosted typefaces carry the engineering-datasheet identity — a characteristic technical grotesque for display (used with restraint), a humanist sans for body, and a monospace/tabular face for all numeric and formula output — without landing on an AI-default look (warm-cream + high-contrast serif + terracotta, etc.)?

Deliverable (linked asset via /prototype): a specimen pairing shown against real tool copy and numbers, self-hosted only (static PWA CSP forbids external fonts), with the type scale, weights, and tabular-figure settings named.

## Answer

Specimen built + published.

- **Asset (live):** https://claude.ai/code/artifact/e97bd0af-5233-4872-9fbc-a85023c95d40
- **Source:** `.scratch/loading-coil/assets/typeface-specimen.html`

**Pairing (all SIL OFL, self-hostable):**
- **Display → Saira Semi Condensed** (600–700, uppercase, tracked) — technical condensed grotesque; instrument/datasheet character; clear of the Inter / Space-Grotesk AI-default cluster. Mastheads, section headers, FIG labels only (restraint).
- **Body → IBM Plex Sans** (400/600) — engineered, even, legible at caption sizes; shares skeleton with Plex Mono for a coherent voice.
- **Data / formula → IBM Plex Mono** (tabular) — every number, dimension, and formula.

**Type scale:** masthead 34px/700, section 20px/700, body 15px/400, mono label 11px/.12em tracking. Tabular-nums on Plex Mono and on Plex Sans wherever digits column.

**Production note:** self-host WOFF2 **subsets** via `@font-face` data-URI (CSP blocks CDNs) — subset to Latin + the glyph set `µ Ω β λ Σ · − °`. Subsetting/embedding is a build task, not a decision. The specimen uses labeled system fallbacks (exact glyphs not shown; scale, weight, tracking, tabular alignment are representative).

No new tickets; no fog graduated.
