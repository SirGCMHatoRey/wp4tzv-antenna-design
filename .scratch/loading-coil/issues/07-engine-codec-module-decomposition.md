# Engine & codec module decomposition

Type: grilling
Label: wayfinder:grilling
Status: resolved

## Question

How do the two pure seams — the physics engine and the URL/state codec — decompose into modules, and what are their public function signatures?

The coefficient basis is now settled (see *Nagaoka & Medhurst coefficient basis*), which named the pieces: `nagaokaKL` (Lundin two-branch), `currentSheetL` (+ optional Rosa flag), `solveGeom` (closed-form N / bracketed Brent for d/ℓ), `selfCapacitance` + `fSelf`, `qFactor` + the embedded `medhurstPhi` table, plus the Stage-1 stub reactance (`Zc`, `X=−Zc·cot(βℓ)`, section split). Decide: module boundaries within `src/lib` (per the SvelteKit static-first structure), the shape of the engine's single `computeLoadingCoil(inputs) → result` entry vs. exposed sub-functions, where the Medhurst Φ table lives as a data asset, the `result` type (including the `ok|warn|block` status + machine-readable reasons the frontend renders), and the codec's `parse`/`serialize` signatures against the versioned `?v=1&…` schema.

Graduated from Fog after *Nagaoka & Medhurst coefficient basis* made the engine surface concrete. Unblocked. Should stay consistent with the two-seam testing decision in the PRD.

## Answer

Decomposition settled via grilling; the cross-cutting architecture is captured in **[ADR-0008](../../../docs/adr/0008-tool-engine-architecture.md)** (sets the pattern for all Engineering Tools). Four decisions:

1. **One public seam:** `computeLoadingCoil(inputs) → Result`. Sub-functions pure-internal (test-exported only).
2. **Result = discriminated union + coded reasons:** `{ok:true, values, warnings[]} | {ok:false, blocks[]}`; blocked carries no numbers (frontend can't render garbage); reason `code`s with data payloads, UI owns the copy.
3. **Shared physics lib now:** `src/lib/physics/` (wavelength, betaVF, skinDepth, nagaoka/Lundin, brent) + `src/lib/tools/loading-coil/`. Reconciles with decision 1 — the physics lib is app-internal shared code; the *tool* still exposes only its one seam.
4. **Codec ↔ UI-state, total parse:** `parse(q)→UIState` never throws; `serialize(UIState)→string` (no outputs); `toEngineInputs(UIState)→EngineInputs` does display→SI. Layering **URL ↔ UI-state ↔ engine(SI)**; version bumps via explicit migrations.

**File / signature map:**

```
src/lib/physics/                 (shared, pure, framework-agnostic)
  wavelength.ts   wavelength(fMHz):m ; betaVF(fMHz,vf)
  skinDepth.ts    skinDepth(fHz,material)
  nagaoka.ts      nagaokaKL(D,l)            // Lundin two-branch
  rootfind.ts     brent(f,lo,hi,opts)
src/lib/tools/loading-coil/
  types.ts        EngineInputs, Result, Reason, ReasonCode, Coil, UIState
  stub.ts         zc(H,a) ; sectionReactance(...) ; requiredInductance(inputs)
  coil.ts         currentSheetL(N,D,l) ; solveGeom(Ltarget,mode,fixed)
                  selfCapacitance(D,l) ; fSelf(L,C) ; qFactor(...)
  engine.ts       computeLoadingCoil(inputs):Result   ← the seam
  codec.ts        parse ; serialize ; toEngineInputs ; migrations
  medhurst-phi.json                                   ← the one data asset
```

Engine consumes **SI** (Hz, m, henries); UI converts. `EngineInputs` carries `mode` + the fixed pair; `Coil` carries `{LuH,Zc,Xlower,Xupper,N,d,len,Q,fSelfMHz}`.

**Follow-ups:** backend surface is now fully specified — *Golden reference dataset* tests `computeLoadingCoil`; the engine is buildable. No new tickets; no fog graduated (remaining fog — PWA shell, Designer handoff, version-bump policy — still not sharply stateable).
