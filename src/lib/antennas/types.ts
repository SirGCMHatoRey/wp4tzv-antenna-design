// Shared types for the Tier-1 closed-form Antenna Model Designers (ADR-0002/0005).
// One engine (length = factor · λ · k) drives every model; each model is data.

export type Shape = 'dipole' | 'vertical' | 'loop' | 'wire';

export interface DesignInputs {
  fMHz: number;
  k: number; // correction factor (velocity × end-effect), exposed
  apexDeg?: number; // inverted-V only
}

export interface Dim {
  label: string;
  m: number; // length in metres (SI); UI converts
  key?: string; // short key for the diagram
}

export interface DesignResult {
  lambdaM: number;
  primaryM: number; // the model's primary conductor length (SI)
  dims: Dim[];
  feed: string; // feedpoint impedance summary
  notes: string[];
}

/** A Tier-1 model's data-driven design descriptor. */
export interface AntennaDesign {
  slug: string;
  name: string;
  shape: Shape;
  /** Primary length as a multiple of λ, before k. dipole 0.5, vertical 0.25, loop ≈1.02. */
  factor: number;
  defaultK: number;
  kBasis: string;
  cite: string;
  accuracy: string;
  feed: string;
  notes: string[];
  loadable?: boolean; // offers the Send-to-Loading-Coil handoff
  hasApex?: boolean; // inverted-V apex-angle input
  loopSides?: number; // 3 (delta) or 4 (quad)
  /** Extra radial/side breakdown from the primary length + λ. */
  dims: (primaryM: number, lambdaM: number, k: number) => Dim[];
}
