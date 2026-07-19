// Display-unit conversions. Internal storage + compute is SI (metres); the
// site-wide units switch (ADR-0007) only affects rendering + the readable URL.
// Rules: radiator length m/ft; coil dims mm/in; inductance always µH; wire mm/AWG.

import type { LengthUnit } from '$lib/stores/app-state';
import { awgToMm, mmToAwg } from './wire';
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

/** Bridge to the site-wide `units` store (m/ft) — exact and reversible so the
 *  Loading Coil can converge onto the global switch without a third representation. */
export function toUnitSystem(u: LengthUnit): UnitSystem {
  return u === 'ft' ? 'imperial' : 'metric';
}
export function toLengthUnit(u: UnitSystem): LengthUnit {
  return u === 'imperial' ? 'ft' : 'm';
}

/** Display-unit geometry converted across a units switch (SI round-trip, convert-not-reset). */
export interface DisplayGeometry {
  H: number;
  a: number;
  d: number;
  len: number;
}
export function convertDisplayGeometry(
  g: DisplayGeometry,
  from: UnitSystem,
  to: UnitSystem
): DisplayGeometry {
  if (from === to) return g;
  return {
    H: fromRadiator(toRadiator(g.H, from), to),
    a: fromCoil(toCoil(g.a, from), to),
    d: fromCoil(toCoil(g.d, from), to),
    len: fromCoil(toCoil(g.len, from), to)
  };
}

/** Wire display value (mm or AWG) converted across a units switch. */
export function convertWireDisplay(wireDisplay: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return wireDisplay;
  const mm = from === 'imperial' ? awgToMm(wireDisplay) : wireDisplay;
  return to === 'imperial' ? mmToAwg(mm) : mm;
}
