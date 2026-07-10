# PRD: Loading Coil Engineering Tool

Status: ready-for-agent
Slug: loading-coil

## Problem Statement

A ham (or RF engineer, student, maker) who wants to use an antenna that is physically shorter than resonant — a mobile whip, a loaded vertical, a short dipole — needs to add a series inductor (a Loading Coil) to bring it to resonance. Today they face two separate, error-prone chores: first work out *how much inductance* the coil must have for their frequency, radiator length, and coil position, and then work out *how to actually wind that inductance* — how many turns on what diameter form with what wire. Existing web calculators give a single magic number with no shown method, no honest error, no coil geometry, and no way to tell whether the resulting coil is even physically buildable or any good. The user can't defend the number and can't build from it.

## Solution

A single Engineering Tool at `/tools/loading-coil` that takes the user from frequency and radiator geometry all the way to a buildable, dimensioned coil — showing its work at every step, in the site's engineering-datasheet style.

Stage 1 computes the **required inductance** to resonate the short radiator, using a first-principles transmission-line model with the characteristic impedance exposed and explained (not hidden), and an honest Accuracy Note. Stage 2 turns that inductance into **coil geometry** — the user fixes any two of {turns, form diameter, coil length} and the tool solves the third — and warns when the coil, while mathematically valid, would be a poor or unbuildable one. The tool works standalone, deep-links from short-vertical Designers, and every input round-trips through a shareable, versioned URL.

## User Stories

1. As a ham with a short mobile whip, I want to enter my operating frequency and whip length and get the inductance needed to resonate it, so that I can order or wind the right coil.
2. As a ham, I want to choose whether the coil is base-loaded or center-loaded, so that the required inductance reflects where I'll actually mount it.
3. As a ham building a center-loaded whip, I want the tool to split my radiator above and below the coil automatically, so that I don't have to model the two sections myself.
4. As an experimenter, I want to place the coil at an arbitrary height on the radiator, so that I can explore positions between base and center.
5. As an RF engineer, I want to see the characteristic impedance (Zc) the model used and the formula behind it, so that I can trust and defend the result rather than accept a magic number.
6. As an RF engineer, I want the per-section capacitive reactance and the required inductive reactance displayed, so that I can verify the reactance-cancellation myself.
7. As a skeptical user, I want an Accuracy Note that states the model's basis and expected error ("±~10%, average-Zc approximation, trim to resonance"), so that I know how much to trust the number and that I must trim to resonance.
8. As a ham who has a specific coil form, I want to fix the form diameter and wire gauge and solve for the number of turns, so that I know exactly how many turns to wind.
9. As a ham with a fixed space for the coil, I want to fix the coil length and diameter and solve for turns, so that the coil fits where it must go.
10. As a designer of a coil, I want to fix turns and diameter and solve for the coil length, so that I can see how long the winding will be.
11. As a user, I want to pick which of turns / diameter / length the tool solves for, so that the tool matches whichever two variables I've already committed to.
12. As a US ham, I want to enter wire as an AWG gauge, so that I can use the vocabulary and stock I actually have.
13. As a non-US ham, I want to enter wire as a millimetre diameter, so that the tool speaks my units.
14. As a user, I want a single metric/imperial switch that puts the radiator in metres or feet and the coil dimensions in millimetres or inches automatically, so that I never see an awkwardly-scaled value like 0.058 m.
15. As a user, I want inductance always shown in microhenries, so that it matches how every coil and datasheet is labelled.
16. As a ham entering insulated wire or tubing, I want to set the conductor's Velocity Factor, so that the electrical length is right for my material.
17. As an RF engineer, I want the tool to apply Velocity Factor but not a resonant end-effect correction to the sections, so that the short-stub physics isn't double-counted.
18. As a builder, I want to be blocked with a clear message when my inputs have no real coil solution, so that I don't copy down a meaningless number.
19. As a builder, I want to be blocked when the wire physically won't fit (close-wound turns longer than the coil length), so that I know to pick a coarser gauge or a longer coil.
20. As a builder, I want a soft warning (not a block) when the coil would have low Q or sit near self-resonance, so that I can still see the result but know it's a poor design.
21. As an RF engineer, I want the estimated Q and self-resonant frequency shown with their source cited, so that the warnings are backed by real numbers, not vibes.
22. As a visual thinker, I want a dimensioned diagram of the wound coil (turns, diameter, length) that updates as I type, so that I can see what I'm about to build.
23. As a user who found a good design, I want a shareable link that encodes all my inputs, so that I can send the exact design to a friend or save it in my notes.
24. As a recipient of a shared link, I want it to reproduce exactly what the sharer saw, so that we're looking at the same coil.
25. As a tinkerer, I want the shareable link to be readable and hand-editable (`?f=7.15&...`), so that I can tweak a value in the URL without re-entering everything.
26. As a returning user, I want to save a named Saved Project of my coil in the browser, so that I can reopen it later without a shared link.
27. As a user without an account, I want saving to work with no login and no server, so that there's zero friction and no privacy cost.
28. As a user of a short-vertical Designer, I want a "Send to Loading Coil" action that pre-fills the tool with my radiator's frequency, height, conductor radius, and velocity factor, so that I don't re-type geometry I already dialed in.
29. As a user, I want that handoff to only appear on antennas that are actually electrically short and loadable, so that the action isn't offered where it makes no sense.
30. As an offline user, I want all calculations to run client-side in the installed PWA, so that the tool works with no connection in the field.
31. As a mobile user in the field, I want the tool usable on a phone screen, so that I can recompute at the antenna site.
32. As a keyboard or screen-reader user, I want fully operable inputs, visible focus, and labelled controls, so that the tool is accessible.
33. As a user sensitive to motion, I want reduced-motion respected, so that live updates don't cause discomfort.
34. As a professional, I want the tool to look like an engineering datasheet, not a generic gradient web app, so that I trust it and it doesn't read as AI-generated.
35. As a user changing units after entering values, I want my numbers converted, not reset, so that I don't lose my work when I flip metric/imperial.
36. As a returning visitor whose old shared link uses an earlier schema, I want the version tag to keep that link working, so that links don't silently break when defaults change.

## Implementation Decisions

### Architecture & seams

- **Two pure seams, frontend thin over them** (confirmed with developer):
  1. **Physics engine** — a pure `computeLoadingCoil(inputs) → result` module. Inputs: design frequency, Loading Position, radiator height H, conductor radius a, Velocity Factor, solve mode, the two fixed geometry variables, wire gauge. Output: required inductance, Zc, per-section reactance, the solved geometry variable, Q, self-resonant frequency, and a status of `ok | blocked | warn` with machine-readable reasons. No DOM, no I/O.
  2. **URL/state codec** — pure `parse(params) → state` and `serialize(state) → params`, versioned.
- The whole tool is client-side (ADR-0001 static-first; ADR-0004 URL-state). **There is no server backend for this tool**: the "backend" of the work is the pure engine + codec + a thin `localStorage` adapter for Saved Projects. Per ADR-0004 a Saved Project persists to `localStorage`, keyed per-browser, no login, no server. (Note: ADR-0001 mentions a thin save API keyed by device token; ADR-0004 supersedes that for persistence — this tool uses `localStorage` only. If cross-device sync is ever needed, that save API is the seam, and the frontend need not change.)

### Stage 1 — required inductance (see ADR-0007)

- **Section-split transmission-line model.** Split the radiator at the Loading Position into a lower and an upper section; model each as a transmission-line stub; size the coil to cancel their combined capacitive reactance. Base loading = split point at the feed; center and arbitrary height use the same engine.
- Per section: `X_sec = −Zc · cot(β·ℓ)`, with `β = 2π/(λ·VF)`.
- `Zc = 60 · [ln(2H/a) − 1]`, **exposed in the UI and explained**, never a hidden constant (ADR-0002).
- `L_req = X_L / (2πf)` where `X_L = −(X_lower + X_upper)`.
- **Design Method = `closed-form`**, cited (ARRL Antenna Book / Kraus). **Accuracy Note**: "±~10%, average-Zc approximation — trim to resonance" (ADR-0005; glossary widened so an approximating Engineering Tool declares both).
- **Correction:** apply the conductor's Velocity Factor only, *not* the full Correction Factor `k`. End-effect is a resonant-λ/2-tip phenomenon; applying it to a non-resonant stub double-counts the shortening. VF is an exposed input (default ~0.95 bare, lower for insulated).

### Stage 2 — coil geometry (see ADR-0007)

- Four coupled variables: inductance L, turns N, form diameter d, coil length ℓ, plus wire gauge. The user fixes two of {N, d, ℓ}; the tool solves the third (three solve modes).
- **Nagaoka current-sheet inductance**: `L = k_L(ℓ/d) · µ₀ · N² · A / ℓ`, `A = π(d/2)²`, `k_L` the Nagaoka coefficient. Accurate across all ℓ/d ratios. Cite Nagaoka 1909.
  - Solve N: closed form. Solve d or ℓ: numeric root-find (k_L has no closed-form inverse).
- **Validation is hybrid**:
  - **Hard-block** the physically impossible: no real solution; close-wound `N·wire-dia > ℓ` (wire won't fit). Message names the input to change.
  - **Soft-warn** the valid-but-inadvisable: low Q; geometry near self-resonance. Result still shown, with a caution badge.
  - No silent input clamping (hiding the "why" fights ADR-0002).
- **Q and self-resonance** via **Medhurst 1947** (empirical Q; self-capacitance → `f_self = 1/(2π√(L·C_self))`). These are advisory figures: the tool's declared Design Method stays `closed-form` for the primary result; Medhurst rides as an inline citation on the advisory badges, not a second top-level Design Method.

### Units

- Internal compute is SI (metres, henries — Nagaoka-native).
- Display driven by the single site-wide `?u=` switch (metric/imperial), **auto-scaling magnitude** (radiator m/ft; coil dims mm/in). Two tool-specific rules: the toggle also selects the wire-gauge family (mm ⇄ AWG), and **inductance is always µH**. No per-field unit controls. Changing units converts existing values, never resets them.

### Interface — Shareable Link, Saved Project, handoff

- **Shareable Link** encodes the full input state as readable, versioned query params (ADR-0004; no opaque tokens):
  `?v=1 & f= & pos= & H= & a= & vf= & mode= & <two of {N,d,len}> & wire= & u=`.
  The encoded geometry pair follows `mode`. **Outputs are never encoded** — re-derived on load. A schema `version` tag pins old links against default drift.
- **Saved Project** persists this same field set to `localStorage`.
- **Antenna Model integration**: standalone-first; a short-vertical Designer offers "Send to Loading Coil" — a **one-way deep link** into `/tools/loading-coil` pre-filling radiator geometry via the same param schema. No shared state, no code coupling. Surfaces only on electrically-short / loadable Antenna Models. (Reusable pattern; promote to its own ADR when a second such handoff appears.)

### Frontend design direction (per /frontend-design + ADR-0006)

- **Aesthetic: engineering datasheet.** Restrained ink/paper palette + one signal accent, hairline rules, tabular/monospace numerals for every dimension and formula, diagram-first, information-dense. **Ban-list is binding** (ADR-0006): no gradients, no indigo/purple, no `rounded-3xl` card soup, no emoji in chrome, no soft glow shadows. A generic/gradient/indigo screen is a bug.
- **Signature element (the memorable one):** the live **wound-coil datasheet diagram** as the hero — a technical solenoid rendering with dimension callouts (N, d, ℓ) and a reactance strip showing the section `X_c` values being cancelled by `X_L`, updating as the user types. The page opens on the diagram, not on a form.
- **Type roles:** a characteristic technical grotesque for display (used with restraint), a humanist sans for body, and a monospace/tabular face for all numeric and formula output. Self-hosted only (static PWA; CSP forbids external fonts).
- **Copy:** name controls by what the user does ("Solve for turns", "Send to Loading Coil"), plain and specific. Blocks and warnings explain what's wrong and how to fix it, in the interface's voice — e.g. "No coil fits: turns would be longer than the coil. Use a coarser wire or a longer coil." Empty/initial state invites the first input.
- **Quality floor (unannounced):** responsive to mobile, visible keyboard focus, reduced-motion respected, screen-reader-labelled controls.

## Testing Decisions

- **A good test asserts external behavior — numbers in, numbers/status out — never implementation details.** Assert against published reference values, not against how the engine is factored internally.
- **Seam 1 — physics engine (`computeLoadingCoil`)** carries the bulk of the suite:
  - Stage-1 `L_req` for known base- and center-loaded cases, cross-checked against ARRL/textbook worked examples within the stated ±10%.
  - `Zc` matches `60·[ln(2H/a)−1]` for sample geometries; VF changes β as expected; verify end-effect `k` is *not* applied.
  - Stage-2 Nagaoka `L` vs published Nagaoka/Wheeler tables across a range of ℓ/d, including short "pancake" ratios where Nagaoka must beat the naive approximation.
  - Each solve mode inverts correctly: solving for the variable and feeding the result back reproduces the fixed inputs (round-trip within numeric tolerance).
  - Q and `f_self` vs Medhurst reference values.
  - Status transitions: `blocked` on no-real-solution and wire-won't-fit; `warn` on low-Q and near-self-resonance; `ok` otherwise — asserted via the machine-readable reasons.
- **Seam 2 — URL/state codec**: `serialize(parse(x)) === x` round-trips for each solve mode; outputs never appear in params; a link written at `v=1` still parses to the same state after a default value changes; the Designer→Tool handoff URL parses into a valid pre-filled state.
- **Frontend**: thin. Only component tests for behavior not reachable through the two pure seams — e.g., solve-mode toggle swaps which two geometry fields are editable, and a `blocked` status disables the result while showing the fix message. Prefer driving the pure seams over DOM tests.
- **Prior art:** this is the first Engineering Tool; establish the pure-engine test pattern here for later tools (SWR, Feed Line Loss) to follow.

## Out of Scope

- Any server backend, save API, accounts, login, or cross-device sync (ADR-0004: `localStorage` only).
- Multi-band / trap / helically-continuous-loaded designs — this tool is a single discrete Loading Coil, not a trap (resonant) or distributed loading.
- Full antenna pattern, gain, efficiency, or radiation-resistance modelling — the tool resonates a radiator; it does not predict performance beyond the advisory Q.
- Toroidal, multi-layer, or ferrite-cored coils — Stage 2 is single-layer air-core solenoid (Nagaoka domain) only.
- Building the short-vertical Designer itself; this PRD only defines the one-way handoff *into* the tool. The Designer emits the link.
- Automatic trimming/optimization to a measured SWR — the Accuracy Note directs the user to trim to resonance manually.

## Further Notes

- Depends on and encodes **ADR-0007** (two-stage closed-form model with exposed Zc). Also governed by ADR-0001 (static-first), ADR-0002 (first-principles, exposed corrections), ADR-0004 (URL state + localStorage), ADR-0005 (declared method + citation), ADR-0006 (engineering-datasheet identity).
- Glossary terms introduced/sharpened during design: **Loading Coil**, **Loading Position**; widened **Engineering Tool**, **Design Method**, **Accuracy Note**, **Velocity Factor**. Use these exact terms in code, tests, and UI copy.
- Deferred, to settle at build time: coil diagram fidelity (schematic vs turn-accurate), default numeric values (VF 0.95, Zc defaults, band presets), and whether Nagaoka `k_L` / Medhurst are implemented as closed-form series or digitized tables.
- The one-way Designer→Tool URL handoff is a reusable pattern; when a second handoff appears, promote it from ADR-0007 to its own ADR.
