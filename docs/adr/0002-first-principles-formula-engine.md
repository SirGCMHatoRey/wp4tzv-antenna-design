# First-principles formula engine with an exposed correction factor

## Context

The spec specified antenna dimensions as fixed constants — `L = 143/f` for a half-wave dipole, `71.5/f` for a quarter-wave vertical, etc. These constants silently bake in a ~0.95 velocity/end-effect correction for bare wire at HF. To an RF engineer the bare constant is opaque ("which velocity factor? what conductor diameter?") and reads as amateur — conflicting with the "professional engineering" and "no AI fingerprints" goals. The site also ships a standalone Velocity Factor calculator, so the correction must be a first-class concept, not a hidden number.

## Decision

Every length calculator derives from free-space wavelength `λ = c/f` (c = 299.792458 m/µs, i.e. 299.792458 / f(MHz) metres) and applies an **explicit correction factor `k`** (velocity factor × end-effect), exposed in the UI and explained per antenna. Defaults are chosen so the out-of-the-box output reproduces the classic constants (e.g. dipole `k ≈ 0.952` → `150/f × 0.952 ≈ 143/f`).

## Consequences

- Same familiar numbers by default, but every result is derived, adjustable, and defensible.
- `k` is not one global value — it varies by antenna type and construction (bare wire vs insulated vs tubing vs coaxial sections). Granularity is settled in a later note.
- Accuracy notes can honestly state the model and its assumptions rather than presenting a magic number.
