// Velocity Factor — exact tool. VF = v/c. Two input paths: measured
// electrical/physical lengths, or a material preset.

export type VfMode = 'lengths' | 'material';

export interface VfInputs {
  mode: VfMode;
  physical?: number; // physical length (any unit)
  electrical?: number; // electrical length (same unit)
  material?: number; // preset VF
}

export interface VfResult {
  vf: number;
}

/** Common feedline / conductor velocity factors. */
export const MATERIALS: { name: string; vf: number }[] = [
  { name: 'Bare copper wire', vf: 0.96 },
  { name: 'PVC-insulated wire', vf: 0.94 },
  { name: 'Open-wire / ladder line', vf: 0.95 },
  { name: 'RG-58 / RG-8 / RG-213 (PE)', vf: 0.66 },
  { name: 'RG-6 (foam PE)', vf: 0.82 },
  { name: 'LMR-400 (foam)', vf: 0.85 },
  { name: 'Solid-PTFE coax', vf: 0.7 }
];

export function computeVelocityFactor(i: VfInputs): VfResult {
  if (i.mode === 'material') return { vf: i.material ?? 0.66 };
  const phys = i.physical ?? 0;
  const elec = i.electrical ?? 0;
  // Physical length is shorter than the free-space (electrical) length: VF = phys/elec.
  const vf = elec > 0 ? phys / elec : NaN;
  return { vf };
}
