// Defensible defaults + band presets. Every value is sourced (defaults research);
// none is a magic number (ADR-0002). Lives in tool config, not the physics, so the
// versioned URL codec can omit-at-default (ADR-0008).

import type { UIState } from './types';
import { awgToMm } from './wire';
import { mmToM } from './units';

export const VF_BARE = 0.96; // bare copper in air (0.95–0.98 mid-range)
export const VF_PVC = 0.94; // PVC-insulated antenna wire (0.93–0.95)

// Note on the opening preset: the defaults research names center loading as the
// headline case, but a center-loaded 40 m whip genuinely needs a large coil that
// will not fit a 1-inch × 2-inch form (the engine correctly blocks WIRE_WONT_FIT).
// So the shipped OPENING preset is a valid, buildable base-loaded design (≈20.6 µH,
// ℓ/d = 3), which opens the tool on its signature diagram rather than a block.
// Center loading is fully available and correctly computed once the user selects it.
export const DEFAULTS: UIState = {
  v: 1,
  fMHz: 7.15, // 40 m, Region 2
  pos: 'base', // buildable opening design (see note above)
  H: 2.5, // typical HF mobile whip / short vertical, m
  a: 0.0032, // ¼-inch whip → 3.2 mm radius
  vf: VF_BARE,
  mode: 'N', // solve for turns by default
  N: 40,
  d: 0.025, // 1-inch coil form
  len: 0.075, // ~3-inch winding → ℓ/d = 3 (accurate Nagaoka regime, wire fits)
  wireDiam: mmToM(awgToMm(16)), // #16 AWG close-wound
  units: 'metric'
};

/** Band presets seed the Design Frequency only; Region/Band model owns edges. */
export const BAND_PRESETS: { band: string; fMHz: number }[] = [
  { band: '160 m', fMHz: 1.9 },
  { band: '80 m', fMHz: 3.7 },
  { band: '40 m', fMHz: 7.15 },
  { band: '30 m', fMHz: 10.125 },
  { band: '20 m', fMHz: 14.175 },
  { band: '17 m', fMHz: 18.11 },
  { band: '15 m', fMHz: 21.225 },
  { band: '12 m', fMHz: 24.94 },
  { band: '10 m', fMHz: 28.5 }
];
