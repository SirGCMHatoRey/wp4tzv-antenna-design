# Loading Coil: two-stage closed-form model with exposed Zc

## Status

Accepted.

## Context

The Loading Coil is listed as an Engineering Tool, but unlike SWR or Wavelength it does not return a single scalar — a usable loading-coil tool must tell the ham how to *wind* the coil (turns, form diameter, coil length, wire gauge). This forced two decisions: widening the *Engineering Tool* glossary definition to allow "the geometry of a single discrete component (never a whole Antenna Model)", and choosing a physics model honest enough to satisfy ADR-0002 (no hidden magic numbers, exposed correction terms, cited method, per-model accuracy note).

Required inductance depends strongly on **where** the coil sits (base loading is simplest but least efficient; center loading splits the radiator). Two families of stage-1 model exist: closed-form transmission-line stub math (first-principles, an exposed characteristic impedance) versus digitized published nomographs (opaque, no exposed term). ADR-0002 and ADR-0005 push toward the closed-form, cited, `method = closed-form` path.

## Decision

Model the Loading Coil as **two stages**:

**Stage 1 — required inductance (section-split transmission-line model).**
Support base *and* center loading (arbitrary height falls out of the same engine). Split the radiator at the Loading Position into a lower and an upper section, model each as a transmission-line stub, and size the coil to cancel their combined capacitive reactance:

```
Zc     = 60 · [ln(2H/a) − 1]          (average characteristic impedance, EXPOSED + explained like k)
X_sec  = −Zc · cot(β·ℓ)                (per section; β = 2π/(λ·VF))
X_L    = −(X_lower + X_upper)          (required inductive reactance)
L_req  = X_L / (2π f)
```

- `method = closed-form`; cite ARRL Antenna Book / Kraus.
- Accuracy Note: "±~10%, average-Zc approximation — trim to resonance."
- Zc is exposed in the UI, not baked as a constant (ADR-0002).

**Stage 2 — coil geometry (user picks the solve target).**
Four coupled variables — inductance `L`, turns `N`, form diameter `d`, coil length `ℓ` — plus wire gauge. The user fixes two of {N, d, ℓ} and the tool solves the third (three UI modes, each with its own validity guard). The geometry formula is **Nagaoka's current-sheet** inductance, chosen for accuracy across all ℓ/d ratios (short "pancake" coils included):

```
L = k_L(ℓ/d) · µ₀ · N² · A / ℓ      A = π(d/2)²     (SI; exposed + cited)
k_L = Nagaoka coefficient, function of ℓ/d
```

- Solve `N`: closed form (`N = √(L·ℓ / (k_L·µ₀·A))`).
- Solve `d` or `ℓ`: numeric root-find, because `k_L(ℓ/d)` is not closed-form invertible.
- Cite Nagaoka 1909.

**Interface — Shareable Link & Saved Project.**
The full input state is encoded as readable, versioned query params (per ADR-0004 and the *Shareable Link* glossary term — no opaque tokens):

```
?v=1 & f= & pos= & H= & a= & vf= & mode= & <two of {N,d,len}> & wire= & u=
```

Because inputs are mode-dependent (`mode` picks which two of N/d/ℓ are user-set), the encoded geometry pair follows `mode`. Outputs are never encoded (they are re-derived on load). A `Saved Project` persists this same field set to `localStorage`.

**Integration with Antenna Models.** The tool is standalone-first (manual H/a/vf/f). A short-vertical Designer additionally offers "Send to Loading Coil" — a **one-way deep link** into `/tools/loading-coil` pre-filling radiator geometry via the same param schema above. No shared state, no code coupling, no back-channel; the Designer just emits a URL (ADR-0004). This preserves the *Engineering Tool* vs *Designer* boundary. The handoff surfaces only on Antenna Models that are electrically short / loadable. This one-way Designer→Tool URL handoff is a reusable pattern; if a second such handoff appears, promote it to its own ADR.

## Consequences

- One engine serves base, center, and arbitrary-height loading — position is just the split point.
- Every displayed number (Zc, X, L, N) is derived and defensible, no hidden constants — consistent with ADR-0002.
- Stage 2 uses Nagaoka for accuracy at all ℓ/d ratios; the cost is a numeric root-finder for the solve-d and solve-ℓ modes (Nagaoka's `k_L` has no closed-form inverse). Nagaoka is unit-agnostic SI, which also cleans up the internal representation (see units decision — no inches-baked constants).
- **Correction:** β uses the conductor's **Velocity Factor** only, *not* the site's full Correction Factor `k`. The end-effect half of `k` is a resonant-λ/2-tip phenomenon; applying it to a non-resonant transmission-line stub would double-count the shortening the reactance-cancellation already models. VF is an exposed input (default ~0.95 bare, lower for insulated).
- **Units:** internal compute is SI (metres, henries — Nagaoka-native). Display is driven by the single site-wide `?u=` switch (metric/imperial), auto-scaling magnitude (radiator m/ft, coil dims mm/in). Two tool-specific wrinkles: the toggle also selects the wire-gauge family (mm ⇄ AWG), and inductance is always shown in µH regardless of system. No per-field unit controls.
- The tool declares both a Design Method (`closed-form`) and an Accuracy Note. The glossary's *Design Method* and *Accuracy Note* were widened to be required on any Engineering Tool that models real physics (exact tools like Wavelength/SWR still declare neither).
- **Validation is hybrid.** The two physically-impossible outcomes — no real solution, and close-wound `N·wire-dia > ℓ` (wire won't fit) — hard-block with a message naming the input to change. The valid-but-inadvisable outcomes — low Q, geometry near self-resonance — still show the result with a soft caution badge. No silent input clamping (that would hide the "why", against ADR-0002). This requires the engine to also estimate Q and self-resonant frequency (`f_self = 1/(2π√(L·C_self))`), not just N/d/ℓ, via **Medhurst 1947** (empirical Q + self-capacitance).
- **Dual method, single declaration.** The primary result (L, N/d/ℓ) is `closed-form`; the advisory Q/f_self figures are `published-design` (Medhurst). The tool declares Design Method = `closed-form` for its primary answer only; Medhurst rides as an inline citation on the advisory badges, not a second top-level Design Method — keeping the *Design Method* concept singular per figure-of-record.
