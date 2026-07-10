# Antenna Design Portal — build map

Label: wayfinder:map
Effort: portal

## Notes

**Domain.** The whole Amateur Radio Antenna Design Portal (CONTEXT.md): ~23 client-side calculators — **Antenna Models** (Designers, `/antennas/*`) and **Engineering Tools** (`/tools/*`) — plus reference tables and diagrams. Static-first prerendered SvelteKit PWA, `localStorage` + versioned readable URL state, no server backend (ADR-0001, ADR-0004). Engineering-datasheet visual identity, ban-list binding (ADR-0006). First-principles math with exposed corrections + cited method + honest Accuracy Note (ADR-0002, ADR-0005).

This map charts the **portal**: enumerate the calculators, build the shared foundations, and sequence the per-calculator efforts. Each individual calculator is its own sub-effort (its own wayfinder map) — the Loading Coil is the first, already designed, and the template.

**Skills every session should consult.** `/domain-modeling` (glossary authoritative), `/grilling` (default), `/prototype` + `/frontend-design` (UI), `/wayfinder` (per calculator sub-effort). Respect ADRs 0001–0008.

**Standing preferences.** Every new calculator reuses the ADR-0008 pattern (shared `src/lib/physics/` + one `compute…` seam per tool, discriminated-union `Result`, codec ↔ UI-state). Datasheet identity + ban-list. Region 2 default.

## Decisions so far

<!-- index only -->

- [Loading Coil tool — designed end-to-end + **BUILT ✅**](../loading-coil/map.md) — first Engineering Tool; live at `/tools/loading-coil`. Full engine (Lundin/Nagaoka/Medhurst) + codec + signature UI + 28 golden tests, all green. Serves as the template for every later tool. Three spec corrections found at build (k_L exact 0.818, VF direction, center-40m default) — see its map.
- [Per-tool engine architecture](../../docs/adr/0008-tool-engine-architecture.md) — single seam, shared physics lib, codec ↔ UI-state — the pattern every calculator follows.
- [Antenna Models enumerated (16, tiered)](./issues/01-enumerate-antenna-models.md) — T1 closed-form staples (9, share λ×k engine) / T2 published-design (3) / T3 complex (4); short antennas = base model + Loading Coil handoff (¼-wave Vertical is the handoff home). [List](./assets/antenna-models-list.md). **Tier 1 BUILT ✅** — shared closed-form Designer engine (`src/lib/antennas/engine.ts`, length = factor·λ·k) + data-driven model specs (`models.ts`) + one shared `Designer.svelte` (per-shape SVG: dipole/vertical/loop/wire) serving all 9 via the `/antennas/[slug]` route; loadable models (dipole, ¼-vertical) deep-link "Shorten & load → Loading Coil" (prefills a 60%-short radiator). 7 engine tests. Tier 2/3 still render the stub.
- [Engineering Tools enumerated (8, confirmed)](./issues/02-enumerate-engineering-tools.md) — **ALL 8 BUILT ✅**: Loading Coil, 5 exact one-liners (Wavelength, VF, Resonant f, Balun, SWR), + Feed Line Loss (digitized coax k1/k2 dataset `feed-line-loss/coax.ts` + closed-form SWR-added loss) + Bandwidth (f/Q, target-SWR). Each a pure `compute…` seam + dedicated route. The `/tools/[slug]` stub route was deleted (all tools live). 56 vitest cases. Tools track complete. [List](./assets/engineering-tools-list.md).
- [Design system & app shell](./issues/03-design-system-and-app-shell.md) — portal-wide datasheet tokens (both themes), type (Saira/Plex), reusable component kit (readout, status ok/warn/block, accuracy-note+method pair, field, segmented, Region selector), SvelteKit static/PWA shell + `/antennas` `/tools` `/reference` routing. Every calculator = shell + kit + one seam. [Prototype](https://claude.ai/code/artifact/afc3d01a-70ae-44fe-911a-cf256eb3065f). **✅ BUILT in-repo** (SvelteKit 2 + Svelte 5 + adapter-static, `src/app.css` tokens, `src/lib/components/*` kit, `src/lib/registry.ts` 24-calc registry, `src/lib/stores/*` theme+center-freq, all 24 slug routes prerender as datasheet stubs, PWA manifest + service-worker offline shell; `npm run build`/`check` green). Self-hosted WOFF2 subsets added (typeface issue 04 ✅): 6 files in `static/fonts/` (Saira SemiCond 600/700, Plex Sans 400/600, Plex Mono 400/600), `pyftsubset` to Latin + `µ Ω β λ Σ · − °`, wired via `@font-face` in `src/app.css`, precached by the service worker. Known font limit: IBM Plex Mono ships no Greek, so Ω/λ/β in mono formulas fall back to `ui-monospace` (µ is covered).
- [Band / Region / Privilege data model](./issues/04-band-region-privilege-data-model.md) — `Region → Band { edges, us?: Privilege[] }`; US overlay optional (R1/3 = edges only); `Privilege { class, mode?, lo, hi }` mode-capable but class-only seed; `legalEdges()` query; lives in `src/lib/data/bands`. Full table = data-entry task. [Model](./assets/band-region-data-model.md).

## Fog

<!-- coarse; graduates as the enumeration + foundation tickets resolve -->

- **Per-Antenna-Model design+build** — itemized in the [tiered list](./assets/antenna-models-list.md); each model an eventual wayfinder sub-effort. Next wave = **Tier 1**, which first needs a **shared closed-form Designer engine** (graduates to a ticket once Tier 1 is picked up + the design system lands). The ¼-wave Vertical Designer is the Loading Coil handoff home.
- **Per-Engineering-Tool design+build** — itemized in the [tools list](./assets/engineering-tools-list.md); Loading Coil done. Next: 5 exact one-liners (batch), then Feed Line Loss (graduates a **coax-loss dataset** research ticket) + Bandwidth. Each a light sub-effort on the shared tool shell.
- **Reference tables & diagrams** (band charts, wire tables) — content surface, coarse.
- **Deployment / hosting / offline-install** — static host + PWA shell specifics.
- **If server persistence is ever needed** — the thin save API is the seam (ADR-0001), out of scope until a real need appears.
