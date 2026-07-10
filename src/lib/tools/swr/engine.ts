// SWR — exact tool. From a (possibly complex) load impedance vs Z₀, or from
// forward/reflected power. Reports SWR, |Γ|, return loss, mismatch loss.

export type SwrMode = 'impedance' | 'power';

export interface SwrInputs {
  mode: SwrMode;
  z0?: number; // characteristic impedance, Ω
  r?: number; // load resistance, Ω
  x?: number; // load reactance, Ω (may be negative)
  pFwd?: number; // forward power (any consistent unit)
  pRev?: number; // reflected power
}
export interface SwrResult {
  gammaMag: number; // |Γ|
  swr: number; // Infinity when |Γ| ≥ 1
  returnLossDb: number; // Infinity for a perfect match
  mismatchLossDb: number;
}

function fromGamma(g: number): SwrResult {
  const gammaMag = Math.min(Math.max(g, 0), 1);
  const swr = gammaMag >= 1 ? Infinity : (1 + gammaMag) / (1 - gammaMag);
  const returnLossDb = gammaMag > 0 ? -20 * Math.log10(gammaMag) : Infinity;
  const mismatchLossDb = gammaMag < 1 ? -10 * Math.log10(1 - gammaMag * gammaMag) : Infinity;
  return { gammaMag, swr, returnLossDb, mismatchLossDb };
}

export function computeSwr(i: SwrInputs): SwrResult {
  if (i.mode === 'power') {
    const pf = i.pFwd ?? 0;
    const pr = i.pRev ?? 0;
    const g = pf > 0 ? Math.sqrt(Math.max(pr, 0) / pf) : 0;
    return fromGamma(g);
  }
  // Complex reflection coefficient: Γ = (R + jX − Z₀) / (R + jX + Z₀).
  const z0 = i.z0 ?? 50;
  const r = i.r ?? 0;
  const x = i.x ?? 0;
  const numRe = r - z0;
  const numIm = x;
  const denRe = r + z0;
  const denIm = x;
  const denMag2 = denRe * denRe + denIm * denIm;
  const g = denMag2 > 0 ? Math.sqrt((numRe * numRe + numIm * numIm) / denMag2) : 1;
  return fromGamma(g);
}
