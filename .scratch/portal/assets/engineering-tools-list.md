# Engineering Tools — canonical list

Asset for ticket *Enumerate the Engineering Tools*. The eight tools under `/tools/*` (CONTEXT's curated set — confirmed complete). Classified **exact** (no Design Method / Accuracy Note per the widened glossary) vs **approximating** (declares both). 16 Models + 8 Tools = 24 ≈ ADR-0001's "~23".

## Exact — trivial one-liners (no Design Method; batch-build to prove the tool shell)

| # | Tool | Inputs → Output | Formula | Note |
|---|------|-----------------|---------|------|
| 1 | Wavelength | f (+opt VF) → λ | λ = c/f (× VF for physical) | consumed by many tools |
| 2 | Velocity Factor | material *or* measured elec/phys lengths → VF | VF = v/c | also an input to Loading Coil, Wavelength, feed line |
| 3 | Resonant Frequency | L, C *or* length → f | f = 1/(2π√LC) or c/(2L·k) | |
| 4 | Balun ratio | Z_in, Z_out → turns/impedance ratio | n = √(Z_out/Z_in) | |
| 5 | SWR | Z & Z₀ *or* P_fwd/P_rev → SWR, Γ, return loss, mismatch loss | SWR = (1+|Γ|)/(1−|Γ|), Γ = (Z−Z₀)/(Z+Z₀) | exact given inputs |

## Approximating — declare Design Method + Accuracy Note

| # | Tool | Inputs → Output | Method | Needs |
|---|------|-----------------|--------|-------|
| 6 | Feed Line Loss | coax type, length, f, SWR → matched loss + total loss under SWR (dB) | published-design (digitized coax loss data) + closed-form SWR-added-loss | **a digitized coax-loss dataset** (own research, like the Loading Coil's Φ table) |
| 7 | Bandwidth | f, Q (or antenna params) → 2:1-SWR bandwidth | closed-form (BW = f/Q) with a Q estimate | Q model / Accuracy Note |
| 8 | Loading Coil | ✅ **designed** — see [its sub-map](../loading-coil/map.md) | closed-form + Medhurst | done |

## Build order (Tools track)

1. **Loading Coil** — done (template).
2. **The 5 exact one-liners** — quick wins; batch-build on the shared tool shell + `src/lib/physics/` primitives (λ, VF, skinDepth already exist). Each is one small `compute…` seam returning the `ok:true` branch (no blocks/warns for exact tools).
3. **Feed Line Loss** — real design sub-effort; needs the coax dataset first (research, mirrors the coefficient-basis ticket).
4. **Bandwidth** — needs a Q model; light design sub-effort.

## Consequences for the map

- Per-tool efforts itemized here (a backlog, not 7 new tickets — avoid over-slicing).
- One graduated research need is concrete: **a digitized coax-loss dataset** for Feed Line Loss — will become a ticket when that tool is picked up.
- Master list now complete: see also [antenna-models-list.md](./antenna-models-list.md).

## Sources

- CONTEXT.md (Engineering Tool, Design Method, Accuracy Note — widened per ADR-0007 session)
- ADR-0002 / ADR-0005 (exact vs declared-method)
