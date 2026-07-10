// The one embedded data asset (ADR-0008): Medhurst's proximity factor Φ for
// single-layer solenoids, function of form factor ℓ/D and pitch ratio p/d.
// Multiplies the skin-effect resistance in the advisory Q estimate only
// (coefficient-basis). Advisory-grade — tagged EST in the UI, never precise.
//
// Grid follows the shape of Medhurst's 1947 close-wound measurements (Φ high for
// short coils, minimum near ℓ/D ≈ 6, rising slowly); the pitch dimension relaxes
// proximity toward 1 as turns are spaced. Bilinear-interpolated below.

export const PHI_TABLE = {
  ellOverD: [0.2, 0.5, 1, 2, 4, 6, 8, 10, 20],
  pitchOverWire: [1, 1.5, 2, 3],
  // phi[i][j] for ellOverD[i], pitchOverWire[j]
  phi: [
    [3.1, 2.155, 1.735, 1.378],
    [2.0, 1.55, 1.35, 1.18],
    [1.55, 1.3025, 1.1925, 1.099],
    [1.3, 1.165, 1.105, 1.054],
    [1.18, 1.099, 1.063, 1.0324],
    [1.15, 1.0825, 1.0525, 1.027],
    [1.16, 1.088, 1.056, 1.0288],
    [1.18, 1.099, 1.063, 1.0324],
    [1.3, 1.165, 1.105, 1.054]
  ]
} as const;

function bracket(vals: readonly number[], x: number): [number, number, number] {
  if (x <= vals[0]) return [0, 0, 0];
  const last = vals.length - 1;
  if (x >= vals[last]) return [last, last, 0];
  let i = 0;
  while (i < last && vals[i + 1] < x) i++;
  const t = (x - vals[i]) / (vals[i + 1] - vals[i]);
  return [i, i + 1, t];
}

/** Bilinear-interpolated Medhurst Φ(ℓ/D, p/d). */
export function medhurstPhi(ellOverD: number, pitchOverWire: number): number {
  const { ellOverD: xs, pitchOverWire: ys, phi } = PHI_TABLE;
  const [i0, i1, tx] = bracket(xs, ellOverD);
  const [j0, j1, ty] = bracket(ys, pitchOverWire);
  const a = phi[i0][j0] + (phi[i0][j1] - phi[i0][j0]) * ty;
  const b = phi[i1][j0] + (phi[i1][j1] - phi[i1][j0]) * ty;
  return a + (b - a) * tx;
}
