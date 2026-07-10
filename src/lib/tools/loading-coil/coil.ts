// Stage 2 — coil geometry (Nagaoka current-sheet) + advisory Q / self-resonance.
// SI throughout. Solve-N closed form; solve-d / solve-ℓ via bracketed Brent
// (L monotonic, coefficient-basis). All figures cited; Q/f_self advisory only.

import { MU0, RHO_COPPER } from '$lib/physics/constants';
import { nagaokaKL } from '$lib/physics/nagaoka';
import { skinDepth } from '$lib/physics/skinDepth';
import { brent } from '$lib/physics/rootfind';
import { medhurstPhi } from './medhurstPhi';
import type { SolveMode } from './types';

const area = (d: number) => Math.PI * (d / 2) * (d / 2);

/** Nagaoka current-sheet inductance L = k_L·µ₀·N²·A/ℓ (henries). */
export function currentSheetL(N: number, d: number, len: number): number {
  const kL = nagaokaKL(d, len);
  return (kL * MU0 * N * N * area(d)) / len;
}

/**
 * Solve the third geometry variable for a target inductance.
 * @returns the solved value (N turns, or d/len in metres) or null if unreachable.
 */
export function solveGeom(
  Ltarget: number,
  mode: SolveMode,
  fixed: { N?: number; d?: number; len?: number }
): number | null {
  if (mode === 'N') {
    const { d, len } = fixed;
    if (d === undefined || len === undefined) return null;
    const kL = nagaokaKL(d, len);
    const N = Math.sqrt((Ltarget * len) / (kL * MU0 * area(d)));
    return Number.isFinite(N) && N > 0 ? N : null;
  }

  if (mode === 'd') {
    // Fixed N, len; L(d) strictly increasing. Bracket [len/500, len·40].
    const { N, len } = fixed;
    if (N === undefined || len === undefined) return null;
    const f = (d: number) => currentSheetL(N, d, len) - Ltarget;
    return brent(f, len / 500, len * 40, { tol: 1e-9 });
  }

  // mode === 'len': fixed N, d; L(len) strictly decreasing. Bracket [d/500, d·400].
  const { N, d } = fixed;
  if (N === undefined || d === undefined) return null;
  const f = (len: number) => currentSheetL(N, d, len) - Ltarget;
  return brent(f, d / 500, d * 400, { tol: 1e-9 });
}

/** Medhurst self-capacitance (F). C/D = 0.1126(ℓ/D)+0.08+0.27√(D/ℓ) pF/cm, D in cm. */
export function selfCapacitance(d: number, len: number): number {
  const Dcm = d * 100;
  const ratio = len / d;
  const cPerCm_pF = 0.1126 * ratio + 0.08 + 0.27 * Math.sqrt(1 / ratio);
  const c_pF = cPerCm_pF * Dcm;
  return c_pF * 1e-12;
}

/** Self-resonant frequency f = 1/(2π√(L·C)), Hz. Advisory (Medhurst-based). */
export function fSelf(LH: number, cF: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(LH * cF));
}

/**
 * Advisory Q = X_L / R_eff, with R_eff the skin-effect series resistance scaled
 * by the Medhurst proximity factor. Copper assumed. Advisory-grade (EST).
 */
export function qFactor(
  fHz: number,
  LH: number,
  N: number,
  d: number,
  len: number,
  wireDiam: number,
  pitch: number
): number {
  const xL = 2 * Math.PI * fHz * LH;
  const delta = skinDepth(fHz);
  const rw = wireDiam / 2;
  const wireLen = N * Math.PI * d;
  // Skin-effect resistance of the winding (δ ≪ rw at HF).
  const rSkin = (RHO_COPPER * wireLen) / (2 * Math.PI * rw * delta);
  const phi = medhurstPhi(len / d, pitch / wireDiam);
  const rEff = rSkin * phi;
  return xL / rEff;
}
