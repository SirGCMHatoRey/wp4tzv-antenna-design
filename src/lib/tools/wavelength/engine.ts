// Wavelength — exact tool. λ = c/f, and the physical length in a medium (×VF).
import { wavelength } from '$lib/physics/wavelength';

export interface WavelengthInputs {
  fMHz: number;
  vf: number; // 1 = free space
}
export interface WavelengthResult {
  lambdaM: number; // free-space wavelength
  physM: number; // physical wavelength in the medium (× VF)
  halfM: number; // physical half-wave
  quarterM: number; // physical quarter-wave
}

export function computeWavelength({ fMHz, vf }: WavelengthInputs): WavelengthResult {
  const lambdaM = wavelength(fMHz);
  const physM = lambdaM * vf;
  return { lambdaM, physM, halfM: physM / 2, quarterM: physM / 4 };
}
