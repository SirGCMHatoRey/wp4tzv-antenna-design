// Shared radial geometry for verticals (issue #4). Elevated radials are cut
// resonant (physical λ/4, VF-only — not the radiator's end-effect k, per the
// same reasoning as the Loading Coil's stub sections). Buried radials do not
// need to be resonant; a many-shorter-radials ground screen outperforms a few
// long ones (Severns, "Experimental Studies of Ground Systems"), so the ground
// system changes both the count and the physical length, not just the count.

import type { Dim, GroundSystem } from './types';

const ELEVATED_COUNT = 4;
const ELEVATED_FACTOR = 0.25 * 0.97; // physical λ/4, VF-trimmed

const GROUND_COUNT = 16;
const GROUND_FACTOR = 0.2; // buried screen: shorter, many (Severns)

/** The radial Dim for a ground system, or undefined when there are no radials. */
export function radialDim(lambdaM: number, groundSystem: GroundSystem): Dim | undefined {
  if (groundSystem === 'none') return undefined;
  const [count, factor] =
    groundSystem === 'elevated-radials'
      ? [ELEVATED_COUNT, ELEVATED_FACTOR]
      : [GROUND_COUNT, GROUND_FACTOR];
  return { label: `Radials ×${count}`, m: factor * lambdaM, key: 'radial' };
}
