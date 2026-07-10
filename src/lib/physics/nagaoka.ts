// Nagaoka's current-sheet coefficient k_L, via Lundin's 1985 handbook formula.
// Closed-form, two-branch, error ≤ 3 ppm vs Nagaoka's elliptic-integral value
// over all form factors (coefficient-basis research). No table needed.
//
// Lundin, "A Handbook Formula for the Inductance of a Single-Layer Circular
// Coil," Proc. IEEE 73(9):1428–1429, 1985. Reproduced at hamwaves.com/inductance.

/**
 * Nagaoka coefficient k_L as a function of coil form factor only.
 * @param d effective winding diameter (any length unit)
 * @param l coil length (same unit as d)
 * @returns k_L ∈ (0, 1]; → 1 for long solenoids, → 0 as l → 0.
 */
export function nagaokaKL(d: number, l: number): number {
  if (d <= 0 || l <= 0) throw new RangeError('nagaokaKL: d and l must be > 0');

  if (l <= d) {
    // Short coil (ℓ ≤ D): argument u = ℓ/D.
    const u = l / d;
    const u2 = u * u;
    const u4 = u2 * u2;
    const u6 = u4 * u2;
    const rational = (1 + 0.383901 * u2 + 0.017108 * u4) / (1 + 0.258952 * u2);
    const bracket =
      rational * (Math.log(4 * d / l) - 0.5) + 0.093842 * u2 + 0.002029 * u4 - 0.000801 * u6;
    return ((2 * l) / (Math.PI * d)) * bracket;
  }

  // Long coil (ℓ > D): argument w = D/ℓ.
  const w = d / l;
  const w2 = w * w;
  const w4 = w2 * w2;
  return (1 + 0.383901 * w2 + 0.017108 * w4) / (1 + 0.258952 * w2) - (4 * d) / (3 * Math.PI * l);
}
