// Small shared display helpers for calculator readouts.

export const FT_PER_M = 3.280839895013123;
const IN_PER_FT = 12;
// Tolerance for the ft/in threshold: absorbs float noise (e.g. a value that's
// exactly 1 ft landing at 0.9999999999999999 after the m→ft multiply)
// without rounding to `dp` first, which would misclassify a genuinely
// sub-foot value under a coarse dp (e.g. dp=0, ft=0.6 → "1" → wrongly 'ft').
const FT_EPS = 1e-9;

export function fmt(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/**
 * A length in metres, formatted in metric (m) or imperial (ft/in).
 * Imperial values under 1 ft render in inches — feet only read sensibly
 * once the quantity is at least a foot.
 */
export function lengthDisp(m: number, imperial: boolean, dp = 3): { value: string; unit: string } {
  if (!Number.isFinite(m)) return { value: '—', unit: imperial ? 'ft' : 'm' };
  if (!imperial) return { value: fmt(m, dp), unit: 'm' };
  const ft = m * FT_PER_M;
  return ft < 1 - FT_EPS ? { value: fmt(ft * IN_PER_FT, dp), unit: 'in' } : { value: fmt(ft, dp), unit: 'ft' };
}
