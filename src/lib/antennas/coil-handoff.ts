// Two-way Designer ⇄ Loading Coil handoff (ADR-0009). URL-only, no shared
// store (ADR-0004): the Designer sends antenna context + coil state out, the
// Loading Coil sends the buildable coil back as a `coil=` param whose value is
// the Loading Coil's own readable query string (codec.ts — one encoding, not two).

import { serialize as serializeCoil, parse as parseCoil, toEngineInputs } from '$lib/tools/loading-coil/codec';
import { computeLoadingCoil } from '$lib/tools/loading-coil/engine';
import type { Coil, UIState } from '$lib/tools/loading-coil/types';
import { ANTENNA_DESIGNS } from './models';
import type { GroundSystem } from './types';

const GROUND_SYSTEMS: readonly GroundSystem[] = ['elevated-radials', 'ground-radials', 'none'];

/** The Designer state a Loading Coil session must hand back unchanged. */
export interface AntennaContext {
  slug: string;
  k?: number;
  apexDeg?: number;
  groundSystem?: GroundSystem;
}

const positive = (raw: string | null): number | undefined => {
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Present only for a `slug` naming a loadable model; a standalone visit → null. */
export function parseAntennaContext(query: string | URLSearchParams): AntennaContext | null {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;
  const slug = q.get('slug');
  if (!slug || !ANTENNA_DESIGNS[slug]?.loadable) return null;
  const g = q.get('g') as GroundSystem | null;
  return {
    slug,
    k: positive(q.get('k')),
    apexDeg: positive(q.get('apex')),
    groundSystem: g && GROUND_SYSTEMS.includes(g) ? g : undefined
  };
}

function contextParams(ctx: AntennaContext | null, into: URLSearchParams) {
  if (!ctx) return;
  into.set('slug', ctx.slug);
  if (ctx.k !== undefined) into.set('k', String(ctx.k));
  if (ctx.apexDeg !== undefined) into.set('apex', String(ctx.apexDeg));
  if (ctx.groundSystem) into.set('g', ctx.groundSystem);
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
 *  buildable coil. */
export function returnLink(base: string, ctx: AntennaContext | null, ui: UIState): string | null {
  if (!ctx) return null;
  if (!computeLoadingCoil(toEngineInputs(ui)).ok) return null;
  const q = new URLSearchParams({ f: String(ui.fMHz) });
  if (ctx.k !== undefined) q.set('k', String(ctx.k));
  if (ctx.apexDeg !== undefined) q.set('apex', String(ctx.apexDeg));
  if (ctx.groundSystem) q.set('g', ctx.groundSystem);
  q.set('coil', encodeCoil(ui));
  return `${base}/antennas/${ctx.slug}?${q.toString()}`;
}
