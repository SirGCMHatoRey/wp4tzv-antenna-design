// Tier-1 Designer Shareable Link (ADR-0008 decision 4, issue #14): the
// Designer's param schema against the shared codec (`$lib/shareable-link`),
// plus the thin parse/serialize wrapper the component calls from
// onMount/$effect. Pulled out of Designer.svelte so link-handling is a plain,
// directly-testable function rather than component lifecycle code.
//
// `AntennaDesign` is the `when` ctx: apex only applies when `design.hasApex`,
// the ground-system param only when `design.ground` is declared (issue #4).

import { num, enumParam, parse, serialize, type LinkSchema, type StateOf } from '$lib/shareable-link';
import type { AntennaDesign, GroundSystem } from './types';

const GROUND_SYSTEMS = ['elevated-radials', 'ground-radials', 'none'] as const satisfies readonly GroundSystem[];

export const designerLinkSchema: LinkSchema<
  {
    f: ReturnType<typeof num>;
    k: ReturnType<typeof num>;
    apex: ReturnType<typeof num<AntennaDesign>>;
    g: ReturnType<typeof enumParam<GroundSystem, AntennaDesign>>;
  },
  AntennaDesign
> = {
  version: 1,
  params: {
    // The old guard was `Number.isFinite(x) && x > 0` (strictly positive) —
    // a value of exactly 0 fell through and left the prior state untouched.
    // The codec's `min` is inclusive (`n < min` fails, so 0 passes `min: 0`),
    // so this is a deliberate, narrow behavior change at one point: an
    // explicit `?f=0` (or `?k=0`, `?apex=0`) link now resolves to a literal
    // 0 instead of silently falling back. 0 MHz / a 0 correction factor / a
    // 0° apex are all physically meaningless anyway and were never reachable
    // from the UI (no input has `min="0"` that stops at 0), so this is
    // judged a non-issue — and it's the one boundary `min` can express; the
    // codec has no "exclusive floor" concept. See issue #14 for the note.
    f: num({ default: 7.15, min: 0 }),
    k: num({ default: 1, min: 0 }),
    apex: num({ default: 120, min: 0, when: (design) => !!design.hasApex }),
    g: enumParam(GROUND_SYSTEMS, { default: 'none', when: (design) => !!design.ground })
  }
};

export type DesignerLinkState = StateOf<typeof designerLinkSchema.params>;

/** Context-specific fallbacks for params whose *effective* default isn't a
 *  fixed literal: `f` falls back to the live center-frequency store value,
 *  `k` to the model's own `defaultK` (both vary per call, not per schema). */
export interface DesignerLinkFallbacks {
  fMHz: number;
  k: number;
}

export interface DesignerLinkValues {
  fMHz: number;
  k: number;
  apexDeg: number;
  groundSystem: GroundSystem;
}

/** Total parse: never throws. A param the link didn't carry resolves to its
 *  caller-supplied fallback (not the schema's static default) — the schema
 *  default exists so the schema is well-formed standalone (e.g. in tests),
 *  but `f`/`k`'s real defaults are the center-freq store and the model's
 *  `defaultK`, which the schema can't know statically. `present` is what
 *  makes that distinction possible (see `$lib/shareable-link`). */
export function parseDesignerLink(
  query: string | URLSearchParams,
  design: AntennaDesign,
  fallbacks: DesignerLinkFallbacks
): DesignerLinkValues {
  const { state, present } = parse(query, designerLinkSchema, design);
  return {
    fMHz: present.f ? state.f : fallbacks.fMHz,
    k: present.k ? state.k : fallbacks.k,
    apexDeg: state.apex,
    groundSystem: present.g ? state.g : (design.ground?.default ?? 'none')
  };
}

/** Serializes the currently-active param set only: `apex` is emitted only
 *  for `design.hasApex` models, `g` only for `design.ground` models. */
export function serializeDesignerLink(values: DesignerLinkValues, design: AntennaDesign): string {
  const state: DesignerLinkState = {
    f: values.fMHz,
    k: values.k,
    apex: values.apexDeg,
    g: values.groundSystem
  };
  return serialize(state, designerLinkSchema, design);
}
