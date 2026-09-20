// AWG ⇄ diameter. Standard IEC/ASTM definition:
//   d(mm) = 0.127 · 92^((36 − n) / 39)
// Used for the wire-gauge input (imperial → AWG, metric → mm) and the
// close-wound wire-fit check.

/** AWG gauge number → bare wire diameter in millimetres. */
export function awgToMm(awg: number): number {
  return 0.127 * Math.pow(92, (36 - awg) / 39);
}

/** Wire diameter in mm → nearest fractional AWG gauge. */
export function mmToAwg(mm: number): number {
  return 36 - 39 * (Math.log(mm / 0.127) / Math.log(92));
}

/** Common HF loading-coil gauges for a picker. */
export const COMMON_AWG = [12, 14, 16, 18, 20, 22, 24, 26];

const fmtMm = (mm: number) => mm.toFixed(2);
const validPositive = (n: number) => Number.isFinite(n) && n > 0;

/** Stage 2 Wire annotation: the *other* representation of the editable value.
 *  Metric primary is mm (shows AWG); imperial primary is AWG (shows mm). */
export function wireAnnotation(primary: number, units: 'metric' | 'imperial'): string {
  if (!validPositive(primary)) return '';
  if (units === 'imperial') return `≈ ${fmtMm(awgToMm(primary))} mm`;
  return `≈ AWG ${Math.round(mmToAwg(primary))}`;
}

/** Stage 1 Conductor radius annotation, labelled as diameter-derived so the
 *  gauge is not misread against the radius shown in the primary field.
 *  `radiusDisplay` is in mm (metric) or inches (imperial). */
export function radiusAnnotation(radiusDisplay: number, units: 'metric' | 'imperial'): string {
  if (!validPositive(radiusDisplay)) return '';
  const diamMm = 2 * (units === 'imperial' ? radiusDisplay * 25.4 : radiusDisplay);
  return `⌀ ${fmtMm(diamMm)} mm ≈ AWG ${Math.round(mmToAwg(diamMm))}`;
}
