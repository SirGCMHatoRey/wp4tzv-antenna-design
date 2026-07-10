// Public types for the Loading Coil engine + codec (ADR-0007, ADR-0008).
// The engine consumes SI; UIState is the display/URL layer.

export type SolveMode = 'N' | 'd' | 'len';
export type UnitSystem = 'metric' | 'imperial';

/** Loading Position (CONTEXT): where the coil sits, as a fraction of H from the
 *  feed. 0 = base (split at feed), 0.5 = center. 'base'/'center' are aliases. */
export type Position = 'base' | 'center' | number;

/** Engine inputs — all SI (Hz, metres, henries). */
export interface EngineInputs {
  fHz: number;
  H: number; // radiator height, m
  a: number; // conductor radius, m
  vf: number; // Velocity Factor
  pos: Position;
  mode: SolveMode;
  /** The two user-fixed geometry variables; the third (== mode) is solved. */
  N?: number;
  d?: number; // form diameter, m
  len?: number; // coil length, m
  wireDiam: number; // wire diameter, m (close-wound → pitch)
}

/** Computed coil — the ok:true payload. SI base + a few display-friendly fields. */
export interface Coil {
  reqInductanceH: number;
  LuH: number;
  zcOhm: number;
  xLowerOhm: number;
  xUpperOhm: number;
  xReqOhm: number; // required inductive reactance (= −(xLower+xUpper))
  betaLowerDeg: number; // β·ℓ_lower in degrees
  betaUpperDeg: number;
  N: number;
  dM: number;
  lenM: number;
  kL: number;
  qEst: number;
  cSelfF: number;
  fSelfMHz: number;
}

export type ReasonCode =
  | 'NO_REAL_SOLUTION'
  | 'WIRE_WONT_FIT'
  | 'ALREADY_RESONANT'
  | 'LOW_Q'
  | 'NEAR_SELF_RESONANCE';

export type Reason = { code: ReasonCode } & Record<string, unknown>;

export type Result =
  | { ok: true; values: Coil; warnings: Reason[] }
  | { ok: false; blocks: Reason[] };

/** UI / URL state — SI-canonical numeric fields; the units flag drives rendering
 *  and the readable URL, not storage. Codec layer: URL ↔ UIState ↔ engine(SI). */
export interface UIState {
  v: number;
  fMHz: number;
  pos: Position;
  H: number; // m
  a: number; // m (conductor radius)
  vf: number;
  mode: SolveMode;
  N: number;
  d: number; // form diameter, m
  len: number; // coil length, m
  wireDiam: number; // m
  units: UnitSystem;
}
