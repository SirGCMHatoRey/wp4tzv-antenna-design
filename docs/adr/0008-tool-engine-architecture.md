# Engineering Tool architecture: single-seam engine, shared physics lib, codec ↔ UI-state

## Status

Accepted. Establishes the pattern for all client-side Engineering Tools; the Loading Coil is the first instance.

## Context

Engineering Tools are pure client-side math (ADR-0001) with two pure test seams (per the Loading Coil PRD): a physics engine and a URL/state codec. Decomposing the first one forces choices that will be copied by every later tool (SWR, Wavelength, Velocity Factor…), so they are worth fixing once: the engine's public surface, how results carry failure, where shared physics lives, and what the codec deals in.

## Decision

**1. One public seam per tool.** Each tool exposes a single fat entry — for the Loading Coil, `computeLoadingCoil(inputs) → Result`. Sub-functions are pure internals; a few are exported for unit tests only, not as a supported API. This is the one tested boundary and the one thing to version.

**2. Results are a discriminated union with coded reasons.**

```ts
type Result =
  | { ok: true;  values: Coil; warnings: Reason[] }   // warn = non-empty warnings
  | { ok: false; blocks: Reason[] };                  // no values exist

type ReasonCode =
  | 'NO_REAL_SOLUTION' | 'WIRE_WONT_FIT' | 'ALREADY_RESONANT'   // blocks
  | 'LOW_Q' | 'NEAR_SELF_RESONANCE';                            // warnings
type Reason = { code: ReasonCode } & Record<string, unknown>;  // + data payload
```

A blocked result carries **no** values, so the frontend cannot render garbage numbers on a hard block. Reasons are machine-readable **codes with data payloads**; the copy lives in the UI (frontend-design owns voice; keeps i18n/units-in-message open; tests assert on codes, not prose).

**3. Shared physics lib, split now.** Cross-tool primitives live in `src/lib/physics/` (`wavelength`, `betaVF`, `skinDepth`, `nagaoka` (Lundin), a `brent` root-finder); tool-specific code in `src/lib/tools/<tool>/`. This is deliberately *not* YAGNI — the primitives are known-shared and cheap, and centralizing them keeps the physics honest across tools. It does **not** contradict decision 1: the shared lib is app-internal code other tools import directly; each *tool* still exposes only its single seam.

**4. Codec deals in UI-state; parse is total.** `parse(query) → UIState` never throws (unknown keys ignored, missing keys → current defaults, `v` recorded); `serialize(UIState) → string` (outputs never encoded); `toEngineInputs(UIState) → EngineInputs` converts display units → SI. Version bumps get explicit `migrate_vN_vM` functions. Layering is **URL ↔ UI-state ↔ engine(SI)**. Keeps readable, hand-editable, resilient links (ADR-0004, CONTEXT *Shareable Link*).

## Consequences

- The engine and codec are framework-agnostic pure TS (zero Svelte deps) — trivially unit-testable and the two seams the suite targets.
- Everything accuracy-critical is closed-form (ADR-0007 / coefficient research); the only embedded data asset is the tool-specific `medhurst-phi.json` (Medhurst Φ for the advisory Q), co-located under the tool, bilinear-interpolated by `qFactor`.
- Adding a tool = a new `src/lib/tools/<tool>/` folder reusing `src/lib/physics/`, exposing one `compute…` seam returning the same `Result` shape — the frontend rendering of `ok/warn/block` is reusable.
- Two stable surfaces now exist: each tool's single entry, and the shared physics lib's primitives. The physics lib is the one that must not churn — treat its signatures as an internal contract.
