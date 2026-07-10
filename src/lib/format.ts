// Small shared display helpers for calculator readouts.

const FT_PER_M = 3.280839895013123;

export function fmt(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** A length in metres, formatted in metric (m) or imperial (ft). */
export function lengthDisp(m: number, imperial: boolean, dp = 3): { value: string; unit: string } {
  if (!Number.isFinite(m)) return { value: '—', unit: imperial ? 'ft' : 'm' };
  return imperial ? { value: fmt(m * FT_PER_M, dp), unit: 'ft' } : { value: fmt(m, dp), unit: 'm' };
}
