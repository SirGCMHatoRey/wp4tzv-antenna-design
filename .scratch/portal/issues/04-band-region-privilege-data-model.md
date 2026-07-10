# Band / Region / Privilege data model

Type: grilling
Label: wayfinder:grilling
Status: resolved

## Question

How is the shared frequency data modelled — the Region (IARU 1/2/3, default 2), Band (with Region-dependent edges), License Class (US/FCC overlay), and Privilege ((class, band, mode) sub-ranges) concepts from CONTEXT — as a static data structure that Designers, the Loading Coil band presets, and the homepage quick-calculator all consume?

Decide the data shape, its provenance/citation (IARU band plans), how the US License-Class overlay nests inside Region 2 without complicating Regions 1/3, and how a calculator queries "legal edges for (region, band, class)". Foundational shared data — the Loading Coil deferred its band presets to this. Deliverable: the data model + a seed dataset.

## Answer

Data model + seed: **`.scratch/portal/assets/band-region-data-model.md`**. Realizes the CONTEXT terms directly — no glossary change.

**Two structural calls (grilling):**
1. **Optional overlay** — `Region → Band { edges, us?: Privilege[] }`. The `us` privileges exist only on Region 2; Regions 1/3 are just `edges`. Simple case = a two-field lookup; complexity confined to the US branch.
2. **Mode-capable schema, class-only seed** — `Privilege { class, mode?, lo, hi }`. The `mode` field honors CONTEXT's `(class, band, mode)` definition but is left undefined in the v1 seed (class-only sub-bands); mode segments fill in later with no schema change.

**Modeling notes:** `Privilege[]` holds multiple non-contiguous segments per class (US General 80m = two ranges). Query `legalEdges(region, band, cls?, mode?)` returns region edges, narrowed by class (and mode if present) only in the US branch; calculators seed Design Frequency from the range midpoint (ties to Loading Coil presets + Center Frequency). Lives in `src/lib/data/bands/*.json`, consumed by the Region selector, Designers, tool presets, homepage.

**Deferred (data-entry tasks, not decisions):** the full band × region × class table, and mode-level segments — schema + query + samples are the pattern.

**Follow-ups:** last foundation ticket. No new tickets; the full-data-entry task is noted in the asset, graduates at build time.
