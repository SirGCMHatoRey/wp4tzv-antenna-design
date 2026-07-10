# Nagaoka & Medhurst coefficient basis

Type: research
Label: wayfinder:research
Status: resolved

## Question

How are the Nagaoka current-sheet coefficient `k_L(ℓ/d)` and the Medhurst Q and self-capacitance figures actually implemented — closed-form series/approximation, or digitized tables with interpolation — and what accuracy does each buy across the ℓ/d range we care about (including short "pancake" coils)?

Deliverable (linked asset): a research summary that picks one basis per figure, states the chosen formula/series or table source with citation, gives the expected error, and flags whether the solve-d / solve-ℓ numeric root-find needs a monotonicity/bracketing guard. This unblocks both the engine's module decomposition (Fog) and the golden reference dataset.

## Answer

Research summary: **`.scratch/loading-coil/assets/coefficient-basis.md`**.

**The basis is not uniform — it splits per figure:**

1. **Nagaoka `k_L` (Stage-2 primary L) → closed-form, Lundin 1985.** Two-branch handbook formula (short ℓ≤D / long ℓ>D), six constants, **error ≤ 3 ppm** — effectively exact. No table. This is the accuracy-critical figure, so no reason to digitize Nagaoka's tables. Optional Rosa round-wire correction (`k_s`, `k_m`, also closed-form) deferred — Lundin-only is well inside the ±10% budget.
2. **Self-capacitance / `f_self` → closed-form Medhurst regression** `C/D = 0.1126(ℓ/D)+0.08+0.27√(D/ℓ)` pF/cm. Advisory-grade only (Knight: lumped self-C is a rough self-resonance predictor) — matches the `EST` tag; never shown as precise.
3. **Q → hybrid.** `Q = X_L/R_eff`; `R_eff` = closed-form skin-effect resistance **× Medhurst proximity factor Φ(ℓ/D, p/d)**. Φ is measured data with no accurate closed form → **one small digitized Φ table with bilinear interpolation**. This is the *only* table in the engine. Advisory-grade.

**Root-find (solve-d / solve-ℓ):** with Lundin `k_L`, `L(ℓ)` is monotonic decreasing and `L(d)` monotonic increasing across the physical domain → bracketed Brent/bisection is robust; seed from the Wheeler estimate. Guards: `d,ℓ>0`, clamp away from `ℓ→0`, assert branch continuity at `ℓ=D`, cap iterations → `blocked` if target L unreachable.

**Engine surface named** (nagaokaKL, currentSheetL, solveGeom, selfCapacitance/fSelf, qFactor + medhurstPhi table). See the asset for signatures + all citations.

**Follow-ups:** unblocks *Golden reference dataset* (now takeable). The engine surface is now concrete enough that **engine/codec module decomposition graduates from Fog to its own ticket**.
