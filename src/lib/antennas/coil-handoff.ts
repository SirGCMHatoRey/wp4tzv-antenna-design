// Two-way Designer ⇄ Loading Coil handoff (ADR-0009). URL-only, no shared
// store (ADR-0004): the Designer sends antenna context + coil state out, the
// Loading Coil sends the buildable coil back as a `coil=` param whose value is
// the Loading Coil's own readable query string (codec.ts — one encoding, not two).

import { serialize as serializeCoil, parse as parseCoil, toEngineInputs } from '$lib/tools/loading-coil/codec';
import { computeLoadingCoil } from '$lib/tools/loading-coil/engine';
import type { Coil, UIState } from '$lib/tools/loading-coil/types';
import { ANTENNA_DESIGNS } from './models';
import { parseDesignerLink, serializeDesignerLink } from './designer-link';
import type { GroundSystem } from './types';

// The antenna context (k / apex / g) is declared once, in the Designer's own
// link schema (designer-link.ts, `when`-conditional per model); this module
// only adds the `slug` naming which Designer the session belongs to.

/** The Designer state a Loading Coil session must hand back unchanged. */
export interface AntennaContext {
  slug: string;
  k: number;
  apexDeg: number;
  groundSystem: GroundSystem;
}

/** Present only for a `slug` naming a loadable model; a standalone visit → null.
 *  Absent/invalid k, apex, g resolve to the model's own defaults. */
export function parseAntennaContext(query: string | URLSearchParams): AntennaContext | null {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;
  const slug = q.get('slug');
  const design = slug ? ANTENNA_DESIGNS[slug] : undefined;
  if (!slug || !design?.loadable) return null;
  const v = parseDesignerLink(q, design, { fMHz: 0, k: design.defaultK });
  return { slug, k: v.k, apexDeg: v.apexDeg, groundSystem: v.groundSystem };
}

/** The context as Designer-schema params (k, conditional apex, conditional g),
 *  minus the Designer's own `f`/`v` — those belong to the surrounding link. */
function contextParams(ctx: AntennaContext | null, into: URLSearchParams) {
  if (!ctx) return;
  const design = ANTENNA_DESIGNS[ctx.slug];
  const p = new URLSearchParams(
    serializeDesignerLink({ fMHz: 0, k: ctx.k, apexDeg: ctx.apexDeg, groundSystem: ctx.groundSystem }, design)
  );
  p.delete('v');
  p.delete('f');
  into.set('slug', ctx.slug);
  for (const [key, value] of p) into.set(key, value);
}

/** Keep the antenna context on the Loading Coil's own address-bar link. */
export function appendAntennaContext(qs: string, ctx: AntennaContext | null): string {
  const q = new URLSearchParams(qs);
  contextParams(ctx, q);
  return q.toString();
}

export const encodeCoil = (ui: UIState): string => serializeCoil(ui);

/** A `coil=` value → its UI state and computed coil, or null when absent or
 *  not a buildable coil (a Designer never displays a coil that doesn't work). */
export function decodeCoil(value: string | null): { ui: UIState; coil: Coil } | null {
  if (!value) return null;
  const ui = parseCoil(value);
  const result = computeLoadingCoil(toEngineInputs(ui));
  return result.ok ? { ui, coil: result.values } : null;
}

/** Designer → Loading Coil. With a loaded `coil` the trip resumes that coil;
 *  otherwise it prefills the deliberately short radiator (`hM`). */
export function outboundUrl(
  base: string,
  ctx: AntennaContext,
  first: { fMHz: number; hM: number },
  coil?: UIState
): string {
  const q = coil
    ? new URLSearchParams(serializeCoil(coil))
    : new URLSearchParams({ f: String(first.fMHz), pos: 'base', H: first.hM.toFixed(3), u: 'm' });
  contextParams(ctx, q);
  return `${base}/tools/loading-coil?${q.toString()}`;
}

/** Loading Coil → Designer. Null unless there is antenna context AND a
 *  buildable coil. Built with the Designer's own link schema. */
export function returnLink(base: string, ctx: AntennaContext | null, ui: UIState): string | null {
  if (!ctx) return null;
  if (!computeLoadingCoil(toEngineInputs(ui)).ok) return null;
  const q = new URLSearchParams(
    serializeDesignerLink(
      { fMHz: ui.fMHz, k: ctx.k, apexDeg: ctx.apexDeg, groundSystem: ctx.groundSystem },
      ANTENNA_DESIGNS[ctx.slug]
    )
  );
  q.set('coil', encodeCoil(ui));
  return `${base}/antennas/${ctx.slug}?${q.toString()}`;
}
