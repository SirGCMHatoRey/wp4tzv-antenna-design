# Golden reference dataset — Loading Coil engine

Asset for ticket *Golden reference dataset*. Fixtures the two pure seams assert against (`computeLoadingCoil` and the codec). Each fixture is tagged by **provenance**:

- **[LIT]** independent published value / literature identity — real external validation.
- **[CALC]** hand-computed from the agreed ADR-0007 / Lundin formulas — a regression baseline + worked check (not independent, but pins the numbers so a refactor can't drift silently).
- **[STATUS]** input → expected `Result` status + reason code.

Constants: `c = 299.792458 m·MHz`, `µ₀ = 4π×10⁻⁷`.

## A. Nagaoka `k_L` — validation chain (physics/nagaoka.ts)

The engine's `k_L` is Lundin 1985. Rather than assert scattered table points, validate the **identity chain**:

| # | Fixture | Expect | Tol | Prov |
|---|---------|--------|-----|------|
| A1 | `nagaokaKL` vs Lundin formula, 50 pts over ℓ/D ∈ [0.05, 50] | machine-exact | 1e-9 | [CALC] |
| A2 | Lundin ≡ Nagaoka's tabulated coefficient | ≤ 3 ppm | 3e-6 | [LIT] — Lundin 1985; electronbunker confirms ≤1 ppm |
| A3 | `k_L(ℓ/D = 1)` | 0.6884 | ±0.001 | [LIT] classic anchor (length = diameter) |
| A4 | `k_L(ℓ/D → ∞)` (e.g. 1000) | → 1.000 | ±0.002 | [LIT] long-solenoid limit |
| A5 | short-coil branch `k_L(ℓ/D = 0.05)` vs `(2/π)(ℓ/D)[ln(4D/ℓ)−0.5]` | asymptote | ±1% | [LIT] |
| A6 | branch continuity at ℓ = D (left vs right limit) | equal | 1e-6 | [CALC] guard |

So `k_L` is pinned to the literature via A2–A5; A1/A6 guard the implementation.

## B. Current-sheet inductance L (coil.ts)

Worked coil = the tool defaults (D = 25 mm, ℓ = 50 mm → ℓ/D = 2, N = 40):

`A = π(0.0125)² = 4.909×10⁻⁴ m²`; base (k_L=1) `L = µ₀N²A/ℓ = 19.74 µH`; with `k_L(ℓ/D=2) ≈ 0.80`:

| # | Fixture (N, D mm, ℓ mm) | Expect L | Tol | Prov |
|---|--------------------------|----------|-----|------|
| B1 | 40, 25, 50 | 15.8 µH | ±2% | [CALC] (`k_L≈0.80`; tol covers k_L rounding) |
| B2 | 40, 25, 50 with k_L forced = 1 | 19.74 µH | ±0.5% | [CALC] pure current-sheet check |
| B3 | short pancake 40, 100, 10 (ℓ/D=0.1) | Nagaoka must beat naive `µ₀N²A/ℓ` by >5× | ratio | [LIT] motivates Nagaoka over naive |

## C. Solve-mode round-trip (coil.ts — solveGeom)

Invertibility: solve for a target, feed the result back, recover the fixed inputs.

| # | Fixture | Expect | Tol | Prov |
|---|---------|--------|-----|------|
| C1 | solve N for L=15.8µH, D=25, ℓ=50 | N ≈ 40.0 | ±0.1 | [CALC] |
| C2 | solve ℓ for L=15.8µH, N=40, D=25 | ℓ ≈ 50 mm | ±0.3 mm | [CALC] Brent |
| C3 | solve d for L=15.8µH, N=40, ℓ=50 | d ≈ 25 mm | ±0.15 mm | [CALC] Brent |
| C4 | monotonicity: L(ℓ) strictly ↓, L(d) strictly ↑ over domain | true | — | [LIT] root-find safety |

## D. Stage-1 required inductance (stub.ts) — base-loaded worked case

f = 7.15 MHz, H = 2.5 m, a = 3.2 mm, VF = 0.96, base-loaded:
`λ = 41.93 m`; `β = 2π/(λ·VF) = 0.1561 rad/m`; `βH = 0.3902 rad (22.4°)`; `cot(βH) = 2.430`;
`Zc = 60·[ln(2·2.5/0.0032) − 1] = 381 Ω`; `X = −Zc·cot(βH) = −926 Ω`; `X_L = +926 Ω`; `L_req = 926/(2π·7.15e6) = 20.6 µH`.

| # | Fixture | Expect | Tol | Prov |
|---|---------|--------|-----|------|
| D1 | Zc(H=2.5, a=3.2mm) | 381 Ω | ±1 Ω | [CALC] |
| D2 | L_req base-loaded (above) | 20.6 µH | ±10% | [CALC] (model ±10% per ADR-0007) |
| D3 | center-loaded same radiator (split 1.25/1.25 m) | two equal −jX stubs, Σ cancels | ±10% | [CALC] section-split |
| D4 | VF 0.96 → 0.94 shifts β·ℓ, raises L_req | monotone ↑ | — | [CALC] VF sensitivity |
| D5 | **cross-check** a published ARRL/textbook loaded-whip example | within ±10% | ±10% | [LIT] — *to be filled from ARRL Antenna Book worked example at build time* |

## E. Advisory figures (coil.ts)

Medhurst self-C: `C/D = 0.1126(ℓ/D)+0.08+0.27√(D/ℓ)` pF/cm. For D=2.5cm, ℓ/D=2 → `C ≈ 1.24 pF`.

| # | Fixture | Expect | Tol | Prov |
|---|---------|--------|-----|------|
| E1 | selfCapacitance(D=25, ℓ=50) | 1.24 pF | ±3% | [CALC] Medhurst regression |
| E2 | fSelf(L=15.8µH, C=1.24pF) | ≈ 36 MHz | ±5% | [CALC] `1/(2π√LC)` |
| E3 | Q(f=7.15MHz, default coil) | in [120, 320] plausibility band | range | [LIT] typical HF single-layer Q — **exact value deferred until the Medhurst Φ table is digitized (build task)** |

## F. Status / validation (engine.ts)

| # | Input | Expect status | Reason code | Prov |
|---|-------|---------------|-------------|------|
| F1 | radiator ≥ resonant (βH ≥ 90°) | `ok:false` | `ALREADY_RESONANT` | [STATUS] |
| F2 | solve-N with close-wound N·wireDia > ℓ (e.g. fine coil, #30 target on short ℓ) | `ok:false` | `WIRE_WONT_FIT` (payload: need, have) | [STATUS] |
| F3 | target L unreachable for fixed pair | `ok:false` | `NO_REAL_SOLUTION` | [STATUS] |
| F4 | valid but Q below threshold | `ok:true` + warnings | `LOW_Q` | [STATUS] |
| F5 | f_self within warn margin of design f | `ok:true` + warnings | `NEAR_SELF_RESONANCE` | [STATUS] |
| F6 | nominal default design | `ok:true`, empty warnings | — | [STATUS] |

## G. Codec round-trip (codec.ts)

| # | Fixture | Expect | Prov |
|---|---------|--------|------|
| G1 | `serialize(parse(x)) === x` for each solve mode | identity | [CALC] |
| G2 | outputs (L, Q, f_self) never appear in serialized params | absent | [CALC] |
| G3 | link written at `v=1` still parses after a default changes | same UIState | [CALC] version pin |
| G4 | Designer→Tool handoff URL parses to a valid pre-filled UIState | valid | [CALC] |
| G5 | unknown key ignored; missing key → default; parse never throws | total | [CALC] |

## Notes

- Two fixtures need a source pulled in at build time: **D5** (published loaded-whip example) and the exact value for **E3** (Q, once Φ is digitized). Everything else is either literature-anchored or hand-computed here and ready to encode.
- The [CALC] fixtures double as the worked examples a reviewer can check by hand from ADR-0007.

## Sources

- [Lundin 1985 handbook formula](https://lup.lub.lu.se/record/144380/file/625001.pdf)
- [R. Weaver, Numerical Methods for Inductance Calculation — confirms Lundin ≡ Nagaoka ≤1 ppm](https://electronbunker.ca/eb/CalcMethods1a.html)
- [D. W. Knight, "Solenoid Inductance Calculation"](https://coil32.net/files/Dave_Knight/Solenoids.pdf)
- [Coil32 — self-capacitance (Medhurst)](https://coil32.net/theory/self-capacitance.html)
- ADR-0007 (Stage-1 stub, Nagaoka, Medhurst) and `.scratch/loading-coil/assets/coefficient-basis.md`.
