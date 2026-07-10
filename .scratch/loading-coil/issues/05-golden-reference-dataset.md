# Golden reference dataset for the engine suite

Type: research
Label: wayfinder:research
Blocked by: 01
Status: resolved

## Question

What is the concrete set of published reference values the engine test suite asserts against — ARRL/textbook worked base- and center-loaded `L_req` cases (within ±10%), Nagaoka `L` table points across ℓ/d including short ratios, and Medhurst Q / self-resonance figures — captured as a fixture table (inputs → expected outputs with tolerances and citations)?

Blocked by *Nagaoka & Medhurst coefficient basis*: the reference set depends on which formulas/tables were chosen, so the goldens validate that choice. Deliverable (linked asset): the fixture dataset the two pure seams test against.

## Answer

Fixture dataset: **`.scratch/loading-coil/assets/golden-reference-dataset.md`** — ~30 fixtures across 7 groups (A Nagaoka k_L, B current-sheet L, C solve round-trip, D Stage-1 L_req, E advisory Q/f_self, F status codes, G codec), each tagged by provenance: **[LIT]** literature-anchored, **[CALC]** hand-computed from ADR-0007/Lundin (regression + worked check), **[STATUS]** input→status code.

**Validation strategy:** rather than digitize Nagaoka's whole table, pin `k_L` to the **literature identity chain** — engine `k_L` ≡ Lundin formula (machine-exact unit test), and Lundin ≡ Nagaoka ≤3 ppm (electronbunker confirms ≤1 ppm) — plus classic anchors (`k_L(ℓ/D=1)=0.6884`, long-solenoid→1). Worked cases (default coil → 15.8 µH; base-loaded 7.15 MHz whip → 20.6 µH; self-C 1.24 pF; f_self ≈36 MHz) are hand-derived in the asset so a reviewer checks them against ADR-0007 directly.

**Two fixtures deferred to build:** D5 (a published ARRL loaded-whip cross-check — pull the exact number from the Antenna Book) and E3's exact Q (needs the Medhurst Φ table digitized). Flagged in the asset; everything else is ready to encode.

**This is the last backend piece** — with the engine surface (ADR-0008) and this fixture set, `computeLoadingCoil` is buildable + testable. No new tickets; no fog graduated.
