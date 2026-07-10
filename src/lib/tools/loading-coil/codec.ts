// URL/state codec (ADR-0008): URL ↔ UIState ↔ engine(SI). parse is total
// (never throws); serialize emits readable, versioned params and never encodes
// outputs (they are re-derived). Schema: ?v=1&f=&pos=&H=&a=&vf=&mode=&<pair>&wire=&u=

import { DEFAULTS } from './defaults';
import { awgToMm, mmToAwg } from './wire';
import { fromRadiator, toRadiator, fromCoil, toCoil } from './units';
import type { EngineInputs, Position, SolveMode, UIState, UnitSystem } from './types';

export const SCHEMA_VERSION = 1;

/** Trim a number to a short, stable decimal string (idempotent round-trip). */
function fmt(n: number, dp = 4): string {
  return String(Number(n.toFixed(dp)));
}

function parsePosition(raw: string | null, fallback: Position): Position {
  if (raw === null) return fallback;
  if (raw === 'base' || raw === 'center') return raw;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n < 1 ? n : fallback;
}

function parseMode(raw: string | null, fallback: SolveMode): SolveMode {
  return raw === 'N' || raw === 'd' || raw === 'len' ? raw : fallback;
}

function num(raw: string | null, fallback: number, positive = true): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (positive && n <= 0) return fallback;
  return n;
}

/** Total parse: unknown keys ignored, missing keys → defaults, never throws. */
export function parse(query: string | URLSearchParams): UIState {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;
  const d = DEFAULTS;

  const units: UnitSystem = q.get('u') === 'ft' ? 'imperial' : 'metric';
  const v = num(q.get('v'), SCHEMA_VERSION);
  const mode = parseMode(q.get('mode'), d.mode);

  // Lengths come in as display units; convert to SI (metres).
  const H = q.has('H') ? toRadiator(num(q.get('H'), fromRadiator(d.H, units)), units) : d.H;
  const a = q.has('a') ? toCoil(num(q.get('a'), fromCoil(d.a, units)), units) : d.a;

  const dia = q.has('d') ? toCoil(num(q.get('d'), fromCoil(d.d, units)), units) : d.d;
  const len = q.has('len') ? toCoil(num(q.get('len'), fromCoil(d.len, units)), units) : d.len;
  const N = num(q.get('N'), d.N);

  const wireDiam = q.has('wire')
    ? units === 'imperial'
      ? awgToMm(num(q.get('wire'), mmToAwg(d.wireDiam * 1000), false)) / 1000
      : num(q.get('wire'), d.wireDiam * 1000) / 1000
    : d.wireDiam;

  const state: UIState = {
    v,
    fMHz: num(q.get('f'), d.fMHz),
    pos: parsePosition(q.get('pos'), d.pos),
    H,
    a,
    vf: num(q.get('vf'), d.vf),
    mode,
    N,
    d: dia,
    len,
    wireDiam,
    units
  };
  return migrate(state);
}

/** Serialize to readable params. Outputs are never emitted; only the two fixed
 *  geometry variables are encoded (the solved third is derived on load). */
export function serialize(s: UIState): string {
  const p = new URLSearchParams();
  p.set('v', String(SCHEMA_VERSION));
  p.set('f', fmt(s.fMHz));
  p.set('pos', typeof s.pos === 'number' ? fmt(s.pos, 3) : s.pos);
  p.set('H', fmt(fromRadiator(s.H, s.units)));
  p.set('a', fmt(fromCoil(s.a, s.units)));
  p.set('vf', fmt(s.vf, 3));
  p.set('mode', s.mode);

  // Encode only the fixed pair (mode names the solved/output variable).
  if (s.mode !== 'N') p.set('N', fmt(s.N, 2));
  if (s.mode !== 'd') p.set('d', fmt(fromCoil(s.d, s.units)));
  if (s.mode !== 'len') p.set('len', fmt(fromCoil(s.len, s.units)));

  p.set('wire', s.units === 'imperial' ? fmt(mmToAwg(s.wireDiam * 1000), 1) : fmt(s.wireDiam * 1000));
  p.set('u', s.units === 'imperial' ? 'ft' : 'm');
  return p.toString();
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

// Version migrations. v1 is current; each bump adds an explicit migrate_vN_vM.
function migrate(state: UIState): UIState {
  // No migrations yet; the version tag pins old links against default drift.
  return { ...state, v: SCHEMA_VERSION };
}
