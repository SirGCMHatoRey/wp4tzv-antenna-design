// URL/state codec (ADR-0008): URL ↔ UIState ↔ engine(SI), built on the shared
// Shareable Link codec (src/lib/shareable-link.ts, ADR-0008 decision 4). parse
// is total (never throws); serialize emits readable, versioned params and
// never encodes outputs (they are re-derived).
// Schema: ?v=1&f=&pos=&H=&a=&vf=&mode=&<pair>&wire=&u=
//
// Two things don't fit the shared codec's plain num()/enumParam() directly, so
// they're layered around it rather than forced into it:
//   - `pos` is base|center|<0..1) fraction — not a fixed enum, not a plain
//     number. It's parsed/serialized by hand, spliced into the query the
//     shared codec produces.
//   - `H`/`a`/`d`/`len` (radiator/coil geometry) and `wire` are display-unit
//     numbers (m/ft, mm/in, mm/AWG) whose SI meaning depends on `units`, which
//     the shared codec has no notion of. Read/write them through the shared
//     schema for defaulting/presence/versioning, but convert SI ⇄ display
//     ourselves around it (units.ts, wire.ts), same as the old codec did
//     inline. To avoid a malformed value round-tripping through the *wrong*
//     unit system (the shared codec's own default substitution doesn't know
//     which units a link was in), presence + validity for these five is
//     checked directly against the raw query, and an invalid/absent value
//     always falls back to the true SI default — never to a display-unit
//     placeholder reinterpreted under whatever units happen to be active.
import { num, enumParam, parse as sParse, serialize as sSerialize, type LinkSchema } from '$lib/shareable-link';
import { DEFAULTS } from './defaults';
import { awgToMm, mmToAwg } from './wire';
import { fromRadiator, toRadiator, fromCoil, toCoil } from './units';
import type { EngineInputs, Position, SolveMode, UIState, UnitSystem } from './types';

/** Only the mode-dependent N/d/len pair needs context: whichever of the three
 *  the current solve mode names is the *solved* output, so it's never read or
 *  written — the other two are the fixed pair. */
interface ModeCtx {
  mode: SolveMode;
}

// The shared codec's `min` is a static floor (n >= min); the old codec's
// `positive` was a strict n > 0 guard. Number.EPSILON as the floor rejects 0
// and negative values exactly like the old guard, for every magnitude this
// tool actually deals in (MHz, turns, velocity factor).
const POSITIVE = Number.EPSILON;

const schema: LinkSchema<
  {
    f: ReturnType<typeof num>;
    H: ReturnType<typeof num>;
    a: ReturnType<typeof num>;
    vf: ReturnType<typeof num>;
    mode: ReturnType<typeof enumParam<SolveMode>>;
    N: ReturnType<typeof num<ModeCtx>>;
    d: ReturnType<typeof num<ModeCtx>>;
    len: ReturnType<typeof num<ModeCtx>>;
    wire: ReturnType<typeof num>;
    u: ReturnType<typeof enumParam<'m' | 'ft'>>;
  },
  ModeCtx
> = {
  version: 1,
  params: {
    f: num({ default: DEFAULTS.fMHz, min: POSITIVE }),
    // Declared in metric display terms (m/mm ≡ SI at these scales) purely so
    // serialize() has a sane default to fall back on; parse() never trusts
    // this default for H/a/d/len — see resolveGeometry below.
    H: num({ default: fromRadiator(DEFAULTS.H, 'metric'), min: POSITIVE }),
    a: num({ default: fromCoil(DEFAULTS.a, 'metric'), min: POSITIVE }),
    vf: num({ default: DEFAULTS.vf, min: POSITIVE }),
    mode: enumParam(['N', 'd', 'len'] as const, { default: DEFAULTS.mode }),
    // Active (read/written) only when it's one of the *fixed* pair — the
    // variable the current mode solves for is never encoded.
    N: num<ModeCtx>({ default: DEFAULTS.N, min: POSITIVE, when: (ctx) => ctx.mode !== 'N' }),
    d: num<ModeCtx>({ default: fromCoil(DEFAULTS.d, 'metric'), min: POSITIVE, when: (ctx) => ctx.mode !== 'd' }),
    len: num<ModeCtx>({
      default: fromCoil(DEFAULTS.len, 'metric'),
      min: POSITIVE,
      when: (ctx) => ctx.mode !== 'len'
    }),
    // No static min: valid wire input is mm > 0 in metric but permits
    // negative/zero AWG numbering in imperial (e.g. 0000 AWG ≈ -3) — a
    // constraint that varies with `units`, which a static schema can't
    // express. Positivity for the metric case is enforced in parse() instead.
    wire: num({ default: DEFAULTS.wireDiam * 1000 }),
    u: enumParam(['m', 'ft'] as const, { default: 'm' })
  }
};

/** The shared schema's version is the single source of truth; kept exported
 *  under its old name since callers/tests already reference it. */
export const SCHEMA_VERSION = schema.version;

/** Trim a number to a short, stable decimal string (idempotent round-trip). */
function fmt(n: number, dp = 4): string {
  return String(Number(n.toFixed(dp)));
}
function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

function parsePosition(raw: string | null, fallback: Position): Position {
  if (raw === null) return fallback;
  if (raw === 'base' || raw === 'center') return raw;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n < 1 ? n : fallback;
}

/** Read+validate one raw query value the way the old codec's local `num()`
 *  did, independent of the shared codec's own default substitution — so a
 *  malformed value always falls through to the *true* SI default the caller
 *  supplies, never to the schema's static display-unit placeholder converted
 *  under the wrong unit system. */
function readDisplayNumber(raw: string | null, requirePositive: boolean): number | undefined {
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (requirePositive && n <= 0) return undefined;
  return n;
}

/** A single geometry field: read its raw display-unit value (when `active` —
 *  false for the currently-solved half of the N/d/len pair), convert to SI, or
 *  fall back to the SI default. Shared by H, a, d, len. */
function resolveGeometry(
  raw: string | null,
  active: boolean,
  toSI: (displayValue: number) => number,
  siDefault: number
): number {
  const displayValue = active ? readDisplayNumber(raw, true) : undefined;
  return displayValue !== undefined ? toSI(displayValue) : siDefault;
}

/** Whether the link explicitly carried `u=` — the shared codec's own
 *  presence-reporting, not a re-derived check at the call site. A bare visit
 *  (no `u=`) must not overwrite a stored Imperial/Metric preference (issue #2). */
export function hasExplicitUnits(query: string | URLSearchParams): boolean {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;
  const { present } = sParse(q, schema);
  return present.u;
}

/** Total parse: unknown keys ignored, missing keys → defaults, never throws. */
export function parse(query: string | URLSearchParams): UIState {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;

  // Pass 1: resolve `mode` — it has no `when` of its own, so this doesn't need
  // ctx. Pass 2 uses that mode as ctx so the N/d/len `when` can evaluate.
  const ctx: ModeCtx = { mode: sParse(q, schema).state.mode };
  const { state: resolved, present } = sParse(q, schema, ctx);

  const units: UnitSystem = resolved.u === 'ft' ? 'imperial' : 'metric';

  const H = resolveGeometry(q.get('H'), true, (v) => toRadiator(v, units), DEFAULTS.H);
  const a = resolveGeometry(q.get('a'), true, (v) => toCoil(v, units), DEFAULTS.a);
  const dia = resolveGeometry(q.get('d'), present.d, (v) => toCoil(v, units), DEFAULTS.d);
  const len = resolveGeometry(q.get('len'), present.len, (v) => toCoil(v, units), DEFAULTS.len);

  // N has no unit conversion (turns are unitless) — the shared codec's own
  // defaulting/mode-gating is already exact, no extra layer needed.
  const N = resolved.N;

  const rawWire = readDisplayNumber(q.get('wire'), units === 'metric');
  const wireDiam =
    rawWire !== undefined
      ? units === 'imperial'
        ? awgToMm(rawWire) / 1000
        : rawWire / 1000
      : DEFAULTS.wireDiam;

  return {
    v: schema.version,
    fMHz: resolved.f,
    pos: parsePosition(q.get('pos'), DEFAULTS.pos),
    H,
    a,
    vf: resolved.vf,
    mode: resolved.mode,
    N,
    d: dia,
    len,
    wireDiam,
    units
  };
}

/** Serialize to readable params. Outputs are never emitted; only the two fixed
 *  geometry variables are encoded (the solved third is derived on load). */
export function serialize(s: UIState): string {
  const ctx: ModeCtx = { mode: s.mode };
  const schemaState = {
    f: round(s.fMHz, 4),
    H: round(fromRadiator(s.H, s.units), 4),
    a: round(fromCoil(s.a, s.units), 4),
    vf: round(s.vf, 3),
    mode: s.mode,
    N: round(s.N, 2),
    d: round(fromCoil(s.d, s.units), 4),
    len: round(fromCoil(s.len, s.units), 4),
    wire: s.units === 'imperial' ? round(mmToAwg(s.wireDiam * 1000), 1) : round(s.wireDiam * 1000, 4),
    u: s.units === 'imperial' ? ('ft' as const) : ('m' as const)
  };
  const qs = sSerialize(schemaState, schema, ctx);

  // Splice `pos` in (right after `f`, matching the tool's long-published
  // shape) — it isn't part of the shared schema (see file header).
  const src = new URLSearchParams(qs);
  const out = new URLSearchParams();
  out.set('v', src.get('v')!);
  out.set('f', src.get('f')!);
  out.set('pos', typeof s.pos === 'number' ? fmt(s.pos, 3) : s.pos);
  for (const key of ['H', 'a', 'vf', 'mode', 'N', 'd', 'len', 'wire', 'u']) {
    if (src.has(key)) out.set(key, src.get(key)!);
  }
  return out.toString();
}

export function toEngineInputs(s: UIState): EngineInputs {
  return {
    fHz: s.fMHz * 1e6,
    H: s.H,
    a: s.a,
    vf: s.vf,
    pos: s.pos,
    mode: s.mode,
    N: s.N,
    d: s.d,
    len: s.len,
    wireDiam: s.wireDiam
  };
}
