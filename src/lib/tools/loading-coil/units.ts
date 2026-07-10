// Display-unit conversions. Internal storage + compute is SI (metres); the
// site-wide units switch (ADR-0007) only affects rendering + the readable URL.
// Rules: radiator length m/ft; coil dims mm/in; inductance always µH; wire mm/AWG.

import type { UnitSystem } from './types';

const FT_PER_M = 3.280839895013123;
const MM_PER_IN = 25.4;

export const mToFt = (m: number) => m * FT_PER_M;
export const ftToM = (ft: number) => ft / FT_PER_M;
export const mToMm = (m: number) => m * 1000;
export const mmToM = (mm: number) => mm / 1000;
export const mToIn = (m: number) => (m * 1000) / MM_PER_IN;
export const inToM = (inch: number) => (inch * MM_PER_IN) / 1000;

/** Radiator-scale length: metres (metric) or feet (imperial). */
export function fromRadiator(m: number, u: UnitSystem): number {
  return u === 'imperial' ? mToFt(m) : m;
}
export function toRadiator(v: number, u: UnitSystem): number {
  return u === 'imperial' ? ftToM(v) : v;
}
export const radiatorUnit = (u: UnitSystem) => (u === 'imperial' ? 'ft' : 'm');

/** Coil-scale length (d, ℓ): mm (metric) or inches (imperial). */
export function fromCoil(m: number, u: UnitSystem): number {
  return u === 'imperial' ? mToIn(m) : mToMm(m);
}
export function toCoil(v: number, u: UnitSystem): number {
  return u === 'imperial' ? inToM(v) : mmToM(v);
}
export const coilUnit = (u: UnitSystem) => (u === 'imperial' ? 'in' : 'mm');
