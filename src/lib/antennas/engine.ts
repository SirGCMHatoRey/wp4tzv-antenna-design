// The shared Tier-1 Designer engine (ADR-0002 first-principles, exposed k).
// length = factor · λ · k; the model supplies the factor and the dimension
// breakdown. Analogous to the Loading Coil engine but for lengths.

import { wavelength } from '$lib/physics/wavelength';
import type { AntennaDesign, DesignInputs, DesignResult } from './types';

export function computeAntenna(design: AntennaDesign, inputs: DesignInputs): DesignResult {
  const lambdaM = wavelength(inputs.fMHz);
  let primaryM = design.factor * lambdaM * inputs.k;

  // Inverted-V: the apex droop slightly shortens the resonant length. A small,
  // honest linear correction (~4% at 90° included angle) — trim to resonance.
  if (design.hasApex && inputs.apexDeg !== undefined) {
    const droop = Math.min(Math.max((180 - inputs.apexDeg) / 90, 0), 1);
    primaryM *= 1 - 0.04 * droop;
  }

  return {
    lambdaM,
    primaryM,
    dims: design.dims(primaryM, lambdaM, inputs.k),
    feed: design.feed,
    notes: design.notes
  };
}
