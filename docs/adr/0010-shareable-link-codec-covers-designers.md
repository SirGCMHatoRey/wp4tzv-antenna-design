# The Shareable Link codec governs Designers as well as Tools

## Status

Accepted. Widens the scope of ADR-0008 decision 4.

## Context

ADR-0008 is titled for Engineering Tool architecture. Its decision 4 fixed a total, versioned codec that deals in UI-state (`parse` never throws, unknown keys ignored, missing keys fall back to defaults, version bumps get explicit migrations). Only the Loading Coil applied it; both Designers hand-rolled near-identical link parsing inside component lifecycle code, unversioned and untestable, and guarded numeric params with an idiom that only worked because `Number(null)` is `0`.

Designers are a distinct domain concept from Tools, but the glossary defines the *Shareable Link* as one concept spanning both, and ADR-0004 governs it without qualification.

## Decision

The shared codec (`src/lib/shareable-link.ts`) is the single mechanism for every Designer and Tool link. A surface *declares* its params as data (key, type, per-param constraint, default, optional `when` condition); the codec owns reading, guarding, defaulting, versioning, migration, totality and the absent-versus-explicit distinction.

- Tier-1 Designer: `designer-link.ts`.
- Tier-2 Designer: `tier2-link.ts` (`el` only for models with elements, `var` only for J-Pole variants, `f2`/`vf` only for dual-band models).
- Loading Coil: `tools/loading-coil/codec.ts`.

Designer links begin emitting `v=1`. An absent `v` resolves as the current version, so every link already published keeps resolving to the same design. Golden-string tests pin those shapes.

## Consequences

- Link handling is an exported, directly testable function per surface, not lifecycle code.
- No surface writes a numeric guard by hand; constraints are per-param and positivity is opt-in.
- The seven small Engineering Tools can adopt the same seam by declaring a schema.
- No schema is bumped here; the migration hook stays a tested pass-through.
