// Stage 1 — required inductance via the section-split transmission-line model
// (ADR-0007). Split the radiator at the Loading Position into lower/upper stubs,
// size the coil to cancel their combined capacitive reactance. Zc is exposed.

import { betaVF, wavelength } from '$lib/physics/wavelength';
import type { EngineInputs, Position } from './types';

const cot = (x: number) => 1 / Math.tan(x);
const RAD2DEG = 180 / Math.PI;

/** Average characteristic impedance Zc = 60·[ln(2H/a) − 1], Ω. Exposed (ADR-0002). */
export function zc(H: number, a: number): number {
  return 60 * (Math.log((2 * H) / a) - 1);
}

/** Resolve a Position to a height fraction of H (0 = base, 0.5 = center). */
export function positionFraction(pos: Position): number {
  if (pos === 'base') return 0;
  if (pos === 'center') return 0.5;
  return Math.min(Math.max(pos, 0), 0.999);
}

export interface StubResult {
  zcOhm: number;
  xLowerOhm: number;
  xUpperOhm: number;
  xReqOhm: number; // required inductive reactance
  betaLowerDeg: number;
  betaUpperDeg: number;
  reqInductanceH: number;
  /** true when no cancellation is needed (radiator already inductive/resonant). */
  alreadyResonant: boolean;
}

/** One section's capacitive reactance X = −Zc·cot(β·ℓ); a zero-length section
 *  (e.g. the lower section under a base-loaded coil) contributes nothing. */
function sectionReactance(Zc: number, beta: number, len: number): number {
  if (len <= 0) return 0;
  return -Zc * cot(beta * len);
}

export function requiredInductance(inputs: EngineInputs): StubResult {
  const { fHz, H, a, vf, pos } = inputs;
  const fMHz = fHz / 1e6;
  const beta = betaVF(fMHz, vf);
  void wavelength; // (λ available for callers; β already folds it in)

  const frac = positionFraction(pos);
  const lenLower = frac * H;
  const lenUpper = H - lenLower;

  const Zc = zc(H, a);
  const xLower = sectionReactance(Zc, beta, lenLower);
  const xUpper = sectionReactance(Zc, beta, lenUpper);
  const xReq = -(xLower + xUpper); // inductive reactance the coil must supply

  const reqInductanceH = xReq > 0 ? xReq / (2 * Math.PI * fHz) : 0;

  return {
    zcOhm: Zc,
    xLowerOhm: xLower,
    xUpperOhm: xUpper,
    xReqOhm: xReq,
    betaLowerDeg: beta * lenLower * RAD2DEG,
    betaUpperDeg: beta * lenUpper * RAD2DEG,
    reqInductanceH,
    // Non-positive required reactance ⇒ nothing to cancel: already at/over resonance.
    alreadyResonant: xReq <= 0
  };
}
