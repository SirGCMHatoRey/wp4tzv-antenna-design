// Balun / transformer ratio — exact tool. Impedance ratio Z_out/Z_in and the
// turns ratio n = √(Z_out/Z_in).

export interface BalunInputs {
  zIn: number;
  zOut: number;
}
export interface BalunResult {
  impedanceRatio: number;
  turnsRatio: number;
  label: string; // e.g. "4 : 1"
}

function niceRatio(r: number): string {
  // Snap to a clean integer ratio when close (1:1, 4:1, 9:1, 1:4 …).
  if (r >= 1) {
    const rounded = Math.round(r);
    if (Math.abs(r - rounded) < 0.03) return `${rounded} : 1`;
    return `${r.toFixed(2)} : 1`;
  }
  const inv = 1 / r;
  const rounded = Math.round(inv);
  if (Math.abs(inv - rounded) < 0.03) return `1 : ${rounded}`;
  return `1 : ${inv.toFixed(2)}`;
}

export function computeBalunRatio({ zIn, zOut }: BalunInputs): BalunResult {
  const impedanceRatio = zIn > 0 ? zOut / zIn : NaN;
  const turnsRatio = Math.sqrt(impedanceRatio);
  return {
    impedanceRatio,
    turnsRatio,
    label: Number.isFinite(impedanceRatio) ? niceRatio(impedanceRatio) : '—'
  };
}
