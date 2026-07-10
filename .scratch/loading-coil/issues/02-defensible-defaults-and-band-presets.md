# Defensible defaults & band presets

Type: research
Label: wayfinder:research
Status: resolved

## Question

What are the defensible default values the tool ships with — Velocity Factor per conductor type (bare wire, insulated, tubing), a sensible default radiator geometry / Zc regime, default form diameter and wire gauge, and the ham-band centre-frequency presets — each with a citation so no default is a magic number (ADR-0002)?

Deliverable (linked asset): a table of defaults with sources, respecting Region/Band vocabulary from CONTEXT.md (band presets should map to the Region model, default Region 2).

## Answer

Sourced defaults table: **`.scratch/loading-coil/assets/defaults-and-band-presets.md`**.

**Key defaults:** VF 0.96 bare / 0.94 PVC (conductor propagation, *not* the 0.95 end-effect k); H 2.5 m; a 3.2 mm (¼″ whip); position center; form d 25 mm (1″); ℓ 50 mm (ℓ/d≈2, in Nagaoka+Medhurst sweet spot); #16 AWG close-wound. **Zc is derived** (≈381 Ω for the defaults), never stored — always EXPOSED.

**Band presets** seed the Design Frequency only (160→1.900 … 10 m→28.500, Region 2). Edges stay owned by the Region/Band/Privilege model — the only real R2-vs-R1/3 difference is the 80 m/40 m upper edge, already handled there, so presets need no per-region variants.

**Engine note:** defaults live in tool config (not the physics), enabling the codec's omit-at-default per ADR-0008.

No new tickets; no fog graduated.
