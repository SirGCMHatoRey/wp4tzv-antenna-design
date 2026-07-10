# Loading Coil tool — build map

Label: wayfinder:map
Effort: loading-coil

## Notes

**Domain.** The Loading Coil Engineering Tool (`/tools/loading-coil`): resonate an electrically-short radiator by computing required inductance (Stage 1, closed-form transmission-line stub, exposed Zc) then the buildable coil geometry (Stage 2, Nagaoka current-sheet, solve any of N/d/ℓ). Full design is settled — see the PRD and ADR-0007. This map charts what remains between "PRD written" and "cleanly buildable": the deferred implementation-basis, defaults, and frontend-signature questions.

**Skills every session should consult.** `/domain-modeling` (glossary is authoritative — use the exact terms Loading Coil, Loading Position, Design Method, Accuracy Note, Velocity Factor), `/grilling` (default for open decisions), `/prototype` (for the look/behavior tickets), `/frontend-design` (any UI ticket).

**Standing preferences for this effort.**
- Engineering-datasheet identity (ADR-0006) — ban-list is binding: no gradients, indigo/purple, `rounded-3xl`, emoji chrome, glow shadows.
- First-principles, exposed corrections, cited method + honest Accuracy Note (ADR-0002, ADR-0005).
- Static-first, client-side, `localStorage` + versioned readable URL state (ADR-0001, ADR-0004). No server backend for this tool.
- Two pure test seams: physics engine, URL/state codec. Frontend thin over them.

## Decisions so far

<!-- index only — detail lives in the linked artifact -->

- [Two-stage model, section-split, exposed Zc](../loading-coil/../../docs/adr/0007-loading-coil-two-stage-model.md) — Stage 1 closed-form stub `X=−Zc·cot(βℓ)`, Zc exposed; base+center via one engine.
- [Stage-2 = Nagaoka, solve any of N/d/ℓ](../../docs/adr/0007-loading-coil-two-stage-model.md) — current-sheet, numeric root-find for d/ℓ modes.
- [VF only, not end-effect k](../../docs/adr/0007-loading-coil-two-stage-model.md) — avoids double-counting on a non-resonant stub.
- [Hybrid validation + Medhurst Q/f_self](../../docs/adr/0007-loading-coil-two-stage-model.md) — block impossible, warn ill-advised.
- [Units, link schema, Designer handoff](../../docs/adr/0007-loading-coil-two-stage-model.md) — global `?u=`, versioned readable params, one-way deep link.
- [Full requirements + user stories + seams](./PRD.md) — the PRD, `ready-for-agent`.
- [Coil datasheet diagram — the signature hero](./issues/03-coil-datasheet-diagram-signature.md) — schematic-proportioned solenoid (turn-capped, N annotated); reactance-balance beam confirmed as signature; numbers-first; amber accent+caution / red block. [Live prototype](https://claude.ai/code/artifact/e4a91b16-5a8d-4f0c-9c57-a2a51b3b3671).
- [Nagaoka & Medhurst coefficient basis](./issues/01-nagaoka-medhurst-coefficient-basis.md) — `k_L` closed-form (Lundin 1985, ≤3 ppm, no table); self-C closed-form Medhurst (advisory); Q hybrid = skin-effect R × one digitized Medhurst Φ table; solve-d/ℓ monotonic → bracketed Brent. [Summary](./assets/coefficient-basis.md).
- [Engine & codec module decomposition](./issues/07-engine-codec-module-decomposition.md) — single seam `computeLoadingCoil→Result`; result = discriminated union + coded reasons; shared `src/lib/physics/` + tool folder; codec ↔ UI-state (total parse) ↔ engine(SI). Pattern captured in [ADR-0008](../../docs/adr/0008-tool-engine-architecture.md).
- [Defensible defaults & band presets](./issues/02-defensible-defaults-and-band-presets.md) — VF 0.96 bare/0.94 PVC; H 2.5 m, a 3.2 mm, d 25 mm, ℓ 50 mm, #16 AWG, center; Zc derived (~381 Ω); band presets seed Design Frequency (R2), edges stay in Region model. [Table](./assets/defaults-and-band-presets.md).
- [Datasheet typeface pairing](./issues/04-datasheet-typeface-pairing.md) — Display Saira Semi Condensed · Body IBM Plex Sans · Data IBM Plex Mono (all OFL, self-hosted WOFF2 subsets); tabular-nums on data. [Specimen](https://claude.ai/code/artifact/e97bd0af-5233-4872-9fbc-a85023c95d40).
- [Golden reference dataset](./issues/05-golden-reference-dataset.md) — ~30 fixtures (k_L via Lundin≡Nagaoka chain, worked coil 15.8µH, base-loaded whip 20.6µH, self-C/f_self, status codes, codec round-trip); [LIT]/[CALC]/[STATUS] tagged. Last backend piece → engine buildable+testable. [Dataset](./assets/golden-reference-dataset.md).
- [Solve-mode & validation layout](./issues/06-solve-mode-validation-layout.md) — solve-mode field-flip (chosen var → dashed SOLVED output); blocks take over the hero + dim readout to "—"; warns badge the offending cell; fix-first copy. [Layout prototype](https://claude.ai/code/artifact/4ba31a9b-01e3-4000-824b-d5071a452505).

**Frontier empty — map fully walked.** All specifiable decisions resolved.

## BUILT ✅ (2026-07-07)

Tool live at `/tools/loading-coil` on the app shell. Pure seams + UI + tests, all green (`npm run build`/`check`/`test`).

- **Physics lib** `src/lib/physics/`: `constants`, `wavelength`+`betaVF`, `nagaoka` (Lundin two-branch, verified k_L(1)=0.68842, →1), `rootfind` (Brent), `skinDepth`.
- **Engine** `src/lib/tools/loading-coil/`: `stub` (Stage 1, Zc exposed), `coil` (Nagaoka L, `solveGeom` closed-N/Brent-d/ℓ, Medhurst self-C + Q), `medhurstPhi` (the one data asset), `engine` (`computeLoadingCoil` seam, discriminated-union Result), `codec` (URL↔UIState↔SI, total parse, versioned), `wire`/`units`/`defaults`.
- **UI** `+page.svelte`: signature coil SVG + reactance beam, solve-mode field-flip, 5 validation states, band presets, units toggle, URL sync, Share link, localStorage Saved Projects.
- **Tests** 28 golden fixtures (A–G) in vitest.

**Three spec corrections found at build (documented in code):**
1. **B1 k_L refined** — fixture's rounded `k_L≈0.80` (→15.8 µH) is the exact Lundin `0.818` (→16.15 µH). Engine uses exact.
2. **D4 VF direction was backwards** — fixture said lower VF *raises* L_req; physics is the opposite for a sub-90° stub (lower VF → larger β·ℓ → smaller cot → less reactance to cancel → less L). Engine is right; test asserts the correct direction.
3. **Center-40m default not buildable** — a center-loaded 40 m whip needs a coil too large for a 1″×2″ form (engine correctly blocks WIRE_WONT_FIT). Opening preset changed to a valid base-loaded design (ℓ/d=3); center stays fully available.

## Fog

- **PWA/offline shell + install behavior** specifics — hangs on the frontend layout tickets settling.
- **Designer-side "Send to Loading Coil" emit UI** and which Antenna Models qualify as loadable — downstream; depends on a short-vertical Designer that doesn't exist yet (out of this PRD's scope). Revisit when a Designer is built.
- **Version-bump policy** for the URL schema when defaults later drift — the schema itself is decided; the migration/deprecation rule is deferred.
