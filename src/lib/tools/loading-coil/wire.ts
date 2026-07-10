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
