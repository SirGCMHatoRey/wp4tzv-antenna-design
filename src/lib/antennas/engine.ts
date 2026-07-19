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

  // Ground System (issue #4): only resolved for models that declare the
  // capability; an omitted input falls back to the model's own default, so
  // links published before this feature keep resolving the same way. Text is
  // a lookup into the model's `ground.text` table, not a branch — extending
  // to a fourth ground system means adding a row, not touching this function.
  const groundSystem = design.ground ? (inputs.groundSystem ?? design.ground.default) : undefined;
  const groundText = groundSystem ? design.ground?.text[groundSystem] : undefined;

  return {
    lambdaM,
    primaryM,
    dims: design.dims(primaryM, lambdaM, inputs.k, groundSystem),
    feed: groundText?.feed ?? design.feed,
    notes: groundText?.notes ?? design.notes,
    accuracy: groundText?.accuracy ?? design.accuracy
  };
}
