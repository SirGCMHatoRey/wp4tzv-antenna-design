# Research: Nagaoka & Medhurst coefficient basis

Asset for ticket *Nagaoka & Medhurst coefficient basis*. Decides how the engine computes the Stage-2 inductance coefficient and the advisory Q / self-resonance figures — closed-form vs digitized table, per figure — with citations, accuracy, and root-find guards.

## TL;DR — the basis is not uniform

| Figure | Basis | Grade | Table needed? |
|--------|-------|-------|---------------|
| Nagaoka coefficient `k_L` (Stage-2 primary L) | **Closed-form — Lundin 1985** | exact (≤3 ppm) | No |
| Round-wire correction on L (optional) | **Closed-form — Rosa `k_s`, `k_m`** | <~0.1% real coil | No (k_m tiny series) |
| Self-capacitance / `f_self` (advisory) | **Closed-form — Medhurst regression** | coarse (advisory only) | No |
| Q factor (advisory) | **Hybrid — closed-form skin-effect R × digitized Medhurst proximity Φ** | advisory | **Yes — small Φ table** |

So: one small digitized table survives (Medhurst's proximity factor Φ for Q); everything accuracy-critical is closed-form.

## 1. Nagaoka coefficient `k_L` — closed-form (Lundin 1985)

Current-sheet inductance: `L = k_L · µ₀ · N² · A / ℓ`, `A = π(D/2)²`. `k_L` is Nagaoka's coefficient, a function of the form factor only (`D/ℓ`). Nagaoka's exact expression uses elliptic integrals; **Lundin's 1985 handbook formula** is a six-figure rational/asymptotic approximation with **error ≤ 3 ppm** over all `ℓ/D`, in two branches:

- **Short coil (ℓ ≤ D):** argument `ℓ/D`; leading behavior `k_L ≈ (2ℓ/πD)·[ln(4D/ℓ) − 0.5]` plus the rational correction.
- **Long coil (ℓ > D):** argument `D/ℓ`; rational polynomial minus the `4D/(3πℓ)` asymptotic term.

Six constants (both branches): `0.383901, 0.017108, 0.258952, 0.093842, 0.002029, 0.000801`. Implement the equation verbatim from Lundin 1985 (reproduced in Knight and Coil32 — see sources). **Guard: the two branches meet at ℓ = D — assert continuity at the switch in a unit test.**

**Decision:** closed-form, Lundin. No Nagaoka table. This is the accuracy-critical figure (the tool's headline L → N), and Lundin makes it effectively exact, so there is no reason to digitize tables.

### Optional round-wire refinement (Rosa)

The current sheet assumes an infinitely-thin helical sheet. Real round wire adds two Rosa corrections — self-inductance `k_s` and mutual `k_m` — giving the hamwaves-style form `L = µ₀[π(DN)²/(4ℓ) − DN(k_s+k_m)/2]`. Both are closed-form. **Recommendation:** ship Lundin-only for v1 (well within the tool's ±10% honesty budget); add Rosa as a later refinement if bench comparison shows it's worth it. Flagged, not required.

## 2. Self-capacitance / `f_self` — closed-form (Medhurst), advisory only

Medhurst's fitted regression: `C/D = 0.1126·(ℓ/D) + 0.08 + 0.27·√(D/ℓ)` pF per cm (D in cm). Then `f_self = 1/(2π√(L·C_self))`. Closed-form, no table.

**Caveat (Knight):** self-capacitance as a lumped predictor of self-resonance is physically rough — good for a *warning threshold*, not a precision figure. This matches the PRD, which tags `f_self` as `EST`. **Decision:** closed-form Medhurst regression, advisory-grade; never present `f_self` as precise.

## 3. Q factor — hybrid (closed-form R × digitized Medhurst Φ), advisory

`Q = X_L / R_eff` with `X_L = 2πf·L`. `R_eff` is the effective series AC resistance from skin depth `δ = √(ρ/(π f µ₀))`, **multiplied by Medhurst's empirical proximity factor Φ**, which depends on *two* ratios — coil form factor `ℓ/D` and winding pitch ratio `p/d`. Φ is Medhurst's measured data; there is no accurate pure closed form. **Decision:** closed-form skin-effect `R` × a **small digitized Φ(ℓ/D, p/d) table with bilinear interpolation**. This is the one table in the engine. Advisory-grade (tagged `EST`), drives only the low-Q soft-warn.

## Root-find guards (Stage-2 solve-d and solve-ℓ)

Solve-N is closed-form. Solve-d / solve-ℓ invert `L(·)` numerically. With Lundin `k_L`:

- **`L(ℓ)` for fixed N, d is monotonic decreasing**; **`L(d)` for fixed N, ℓ is monotonic increasing** — across the whole physical domain. So a bracketed method (Brent / bisection) is robust and can't land on a spurious root.
- Seed the bracket from the analytic Wheeler estimate (`L≈d²N²/(18d+40ℓ)` in) for fast convergence.
- **Guards:** enforce `d, ℓ > 0`; clamp the search away from `ℓ → 0` (short-branch `k_L → 0`); assert branch continuity at `ℓ = D`; cap iterations and surface a `blocked` "no real solution" status if the target L is outside the achievable range for the fixed pair.

## What the engine needs (implementation surface)

- `nagaokaKL(D, ℓ)` — Lundin two-branch, pure.
- `currentSheetL(N, D, ℓ)` — uses `nagaokaKL`; optional Rosa correction behind a flag.
- `solveGeom(L_target, mode, fixedPair)` — closed-form for N; bracketed Brent for d/ℓ.
- `selfCapacitance(D, ℓ)` + `fSelf(L, C)` — Medhurst regression, advisory.
- `qFactor(f, D, ℓ, p, wire)` — skin-effect R × `medhurstPhi(ℓ/D, p/d)` (small embedded table + bilinear interp), advisory.
- One embedded data asset: the Medhurst Φ table. Everything else is formulae + constants.

## Sources

- [Lundin, "A Handbook Formula for the Inductance of a Single-Layer Circular Coil," Proc. IEEE 73(9):1428–1429, 1985](https://lup.lub.lu.se/record/144380/file/625001.pdf)
- [Coil32 — single-layer coil formulas (Lundin reproduction)](https://coil32.net/single-layer-coil.html)
- [Coil32 — self-capacitance (Medhurst regression)](https://coil32.net/theory/self-capacitance.html)
- [Coil32 — Q factor theory](https://coil32.net/theory/qfactor.html)
- [D. W. Knight, "The self-resonance and self-capacitance of solenoid coils"](http://www.tuks.nl/pdf/Reference_Material/David%20Knight%20-%20The%20self-resonance%20and%20self-capacitance%20of%20solenoid%20coils.pdf)
- [hamwaves — RF inductance calculator (full method: Lundin + Rosa + Medhurst Q)](https://hamwaves.com/inductance/en/index.html)
- Medhurst, R. G., "H.F. Resistance and Self-Capacitance of Single-Layer Solenoids," Wireless Engineer, Feb/Mar 1947 (primary; the Φ and self-C data).
