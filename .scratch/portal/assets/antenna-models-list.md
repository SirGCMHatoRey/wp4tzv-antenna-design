# Antenna Models — canonical enumerated list

Asset for ticket *Enumerate the Antenna Models*. The Designers under `/antennas/*`, tiered by Design Method / build effort. Two scope calls (from grilling):

- **Short/loaded antennas are not separate models** — the full-size Designer offers a "shorten & load" path that deep-links into the Loading Coil tool (ADR-0007 handoff). "Loadable source" column marks which Designers offer it.
- **Full enumeration, three build tiers** — T1 closed-form staples first (share one λ×k engine), T2 published-design, T3 complex/niche.

## Tier 1 — closed-form staples (build first; share the λ = c/f × k engine, ADR-0002)

| # | Antenna Model | Design Method | Source | Loadable source |
|---|---------------|---------------|--------|-----------------|
| 1 | Half-Wave Dipole | closed-form (λ/2 × k) | ARRL Antenna Book | yes → short dipole |
| 2 | Inverted-V Dipole | closed-form (λ/2 × k + apex-angle note) | ARRL | — |
| 3 | Folded Dipole | closed-form (λ/2, 4:1 Z) | ARRL | — |
| 4 | Quarter-Wave Vertical / Ground-Plane | closed-form (λ/4 × k) | ARRL | **yes → mobile whip (primary handoff)** |
| 5 | 5/8-Wave Vertical | closed-form (0.625λ + matching note) | ARRL | — |
| 6 | End-Fed Half-Wave (EFHW) | closed-form (λ/2 + high-Z feed note) | ARRL | — |
| 7 | Full-Wave Loop (Quad) | closed-form (perimeter ≈ 1λ × k) | ARRL | — |
| 8 | Delta Loop | closed-form (perimeter ≈ 1λ × k, triangle) | ARRL | — |
| 9 | Random / Long Wire | closed-form (length + feed/tuner note) | ARRL | — |

## Tier 2 — published-design (need digitized cited sources)

| # | Antenna Model | Design Method | Source |
|---|---------------|---------------|--------|
| 10 | Yagi-Uda | published-design | DL6WU / NBS TN-688 (already cited ADR-0002/0005) |
| 11 | Moxon Rectangle | published-design | Moxon / Cebik empirical formulas |
| 12 | J-Pole / Slim Jim | published-design | matching-section dimensions |

## Tier 3 — complex / niche (each its own research sub-effort)

| # | Antenna Model | Design Method | Source / note |
|---|---------------|---------------|---------------|
| 13 | Magnetic Loop (Small Transmitting Loop) | closed-form (complex: circumference, tuning C, efficiency, HV) | own research |
| 14 | Discone | published-design (broadband dimensions) | own research |
| 15 | G5RV | published-design (fixed 102 ft + matching stub) | published |
| 16 | Off-Center-Fed Dipole (Windom) | published-design (feed-point ratio) | published |

## Count reconciliation

16 Antenna Models + 8 Engineering Tools (CONTEXT) ≈ **24** calculators — consistent with ADR-0001's "~23". The Engineering Tools list is confirmed separately in *Enumerate the Engineering Tools*.

## Consequences for the map

- **Tier 1 shares one closed-form Designer engine** (λ = c/f, exposed k per antenna) — analogous to the Loading Coil engine but for lengths. Designing that shared engine + Designer shell is the natural next graduated effort once Tier 1 is picked up (depends on the design system).
- Each model is its own wayfinder sub-effort when built; Tier 1 is the next build wave, Tier 3 each needs its own research first.
- The **Quarter-Wave Vertical Designer is the primary home** for the Loading Coil "Send to Loading Coil" handoff — resolves the coil map's open "needs a short-vertical Designer" fog.

## Sources

- CONTEXT.md (Antenna Model, Design Method, Correction Factor definitions)
- [ARRL Antenna Book](https://www.arrl.org/arrl-antenna-book) — Tier 1 closed-form dimensions
- ADR-0002 (first-principles k), ADR-0005 (declared method + citation)
