// Resonant Frequency — exact tool. LC tank: f = 1/(2π√(LC)); or a resonant
// half-wave element of physical length ℓ: f = c·k / (2ℓ).
import { C_M_MHZ } from '$lib/physics/constants';

export type ResMode = 'lc' | 'length';

export interface ResInputs {
  mode: ResMode;
  L?: number; // henries
  C?: number; // farads
  lenM?: number; // element length, metres
  k?: number; // correction factor (default 0.95 for a real half-wave)
}
export interface ResResult {
  fHz: number;
  fMHz: number;
}

export function computeResonantFrequency(i: ResInputs): ResResult {
  let fHz: number;
  if (i.mode === 'lc') {
    const L = i.L ?? 0;
    const C = i.C ?? 0;
    fHz = L > 0 && C > 0 ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : NaN;
  } else {
    const len = i.lenM ?? 0;
    const k = i.k ?? 0.95;
    // Half-wave resonance: ℓ = (λ/2)·k ⇒ f[MHz] = C·k / (2ℓ).
    fHz = len > 0 ? (C_M_MHZ * k * 1e6) / (2 * len) : NaN;
  }
  return { fHz, fMHz: fHz / 1e6 };
}
