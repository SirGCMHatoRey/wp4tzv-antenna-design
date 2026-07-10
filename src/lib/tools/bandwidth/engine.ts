// Bandwidth — approximating tool (declares method + Accuracy Note).
// Single-resonance model: −3 dB bandwidth = f/Q; the target-SWR bandwidth is
// BW = (f/Q)·(SWR−1)/√SWR (ARRL). A real antenna deviates from a lumped RLC.

export interface BandwidthInputs {
  fMHz: number;
  q: number;
  targetSwr: number; // e.g. 2 for the 2:1-SWR bandwidth
}

export interface BandwidthResult {
  bwMHz: number; // bandwidth at the target SWR
  bw3dbMHz: number; // half-power bandwidth (f/Q)
  fLowMHz: number;
  fHighMHz: number;
  fractionalPct: number;
}

/** Rough Q by antenna type — for a starting estimate when Q isn't measured. */
export const Q_PRESETS: { name: string; q: number }[] = [
  { name: 'Thin-wire dipole', q: 13 },
  { name: 'Fat / cage dipole', q: 8 },
  { name: 'Quarter-wave vertical', q: 11 },
  { name: 'Loaded mobile whip', q: 120 },
  { name: 'Small transmitting loop', q: 250 }
];

export function computeBandwidth(i: BandwidthInputs): BandwidthResult {
  const q = Math.max(i.q, 1e-6);
  const swr = Math.max(i.targetSwr, 1.0001);
  const bw3dbMHz = i.fMHz / q;
  const bwMHz = bw3dbMHz * ((swr - 1) / Math.sqrt(swr));
  return {
    bwMHz,
    bw3dbMHz,
    fLowMHz: i.fMHz - bwMHz / 2,
    fHighMHz: i.fMHz + bwMHz / 2,
    fractionalPct: (bwMHz / i.fMHz) * 100
  };
}
