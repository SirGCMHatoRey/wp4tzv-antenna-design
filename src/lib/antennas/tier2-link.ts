// Tier-2 Designer Shareable Link (ADR-0008 decision 4, issue #7): the Tier-2
// param schema against the shared codec, plus the thin parse/serialize wrapper
// Tier2Designer.svelte calls. Mirrors designer-link.ts for the Tier-1 Designer.
//
// `Tier2Design` is the `when` ctx: `el` only when `hasElements`, `var` only when
// `hasVariant`, `f2`/`vf` only for a dual-band model. Links published before
// this codec carry no `v`; an absent version resolves as the current one.

import { num, enumParam, parse, serialize, type LinkSchema } from '$lib/shareable-link';
import type { Tier2Design, JVariant } from './tier2';

const VARIANTS = ['jpole', 'slimjim', 'superj'] as const satisfies readonly JVariant[];

// The old hand-rolled guard was strictly positive (finite && > 0); Number.EPSILON
// as the codec's inclusive floor rejects 0 and negatives identically, so no
// published link changes meaning.
const POSITIVE = Number.EPSILON;

export const tier2LinkSchema: LinkSchema<
  {
    f: ReturnType<typeof num>;
    k: ReturnType<typeof num>;
    el: ReturnType<typeof num<Tier2Design>>;
    var: ReturnType<typeof enumParam<JVariant, Tier2Design>>;
    f2: ReturnType<typeof num<Tier2Design>>;
    vf: ReturnType<typeof num<Tier2Design>>;
  },
  Tier2Design
> = {
  version: 1,
  params: {
    f: num({ default: 7.15, min: POSITIVE }),
    k: num({ default: 1, min: POSITIVE }),
    el: num({ default: 3, min: POSITIVE, when: (d) => !!d.hasElements }),
    var: enumParam(VARIANTS, { default: 'jpole', when: (d) => !!d.hasVariant }),
    f2: num({ default: 448.5, min: POSITIVE, when: (d) => !!d.dual }),
    vf: num({ default: 0.66, min: POSITIVE, when: (d) => !!d.dual })
  }
};

/** `f`/`k` real defaults vary per model (the live center-frequency store, the
 *  model's `defaultK`), so the caller supplies them; see designer-link.ts. */
export interface Tier2LinkFallbacks {
  fMHz: number;
  k: number;
}

export interface Tier2LinkValues {
  fMHz: number;
  k: number;
  elements: number;
  variant: JVariant;
  f2MHz: number;
  vf: number;
}

/** Total parse: never throws. A param the link didn't carry resolves to the
 *  model's own default (dual-band f2/vf from `design.dual`). */
export function parseTier2Link(
  query: string | URLSearchParams,
  design: Tier2Design,
  fallbacks: Tier2LinkFallbacks
): Tier2LinkValues {
  const { state, present } = parse(query, tier2LinkSchema, design);
  return {
    fMHz: present.f ? state.f : fallbacks.fMHz,
    k: present.k ? state.k : fallbacks.k,
    elements: state.el,
    variant: state.var,
    f2MHz: present.f2 ? state.f2 : (design.dual?.defaultF2 ?? state.f2),
    vf: present.vf ? state.vf : (design.dual?.defaultVf ?? state.vf)
  };
}

/** Emits the currently-active param set only. */
export function serializeTier2Link(values: Tier2LinkValues, design: Tier2Design): string {
  return serialize(
    { f: values.fMHz, k: values.k, el: values.elements, var: values.variant, f2: values.f2MHz, vf: values.vf },
    tier2LinkSchema,
    design
  );
}
