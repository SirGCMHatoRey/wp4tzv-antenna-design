import { C_M_MHZ } from './constants';

/** Free-space wavelength in metres for a frequency in MHz. */
export function wavelength(fMHz: number): number {
  return C_M_MHZ / fMHz;
}

/**
 * Phase constant β = 2π / (λ · VF) in rad/m, using the conductor's Velocity
 * Factor to shorten the wavelength in the medium. Per ADR-0007 the Loading Coil
 * applies VF only (not the resonant end-effect k) to its transmission-line stubs.
 */
export function betaVF(fMHz: number, vf: number): number {
  return (2 * Math.PI) / (wavelength(fMHz) * vf);
}
