// Shared types for the Tier-1 closed-form Antenna Model Designers (ADR-0002/0005).
// One engine (length = factor · λ · k) drives every model; each model is data.

export type Shape = 'dipole' | 'vertical' | 'loop' | 'wire';

/** Ground System (issue #4): how a vertical meets ground. Only verticals declare
 *  the capability; every other shape is unaffected (no capability, inert input). */
export type GroundSystem = 'elevated-radials' | 'ground-radials' | 'none';

export interface DesignInputs {
  fMHz: number;
  k: number; // correction factor (velocity × end-effect), exposed
  apexDeg?: number; // inverted-V only
  groundSystem?: GroundSystem; // verticals only; ignored (and inert) elsewhere
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
  accuracy: string; // the honest Accuracy Note, resolved against groundSystem where offered
}

/** The feed/notes/accuracy for one ground system — data, not a branch. */
export interface GroundText {
  feed: string;
  notes: string[];
  accuracy: string;
}

/** A vertical's ground-system capability: which options it offers, which is
 *  conventional for the design, and the resolved text for each. Models without
 *  this field offer no ground choice (dipoles, loops, wires). */
export interface GroundCapability {
  options: GroundSystem[];
  default: GroundSystem;
  text: Record<GroundSystem, GroundText>;
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
  ground?: GroundCapability; // verticals only (issue #4)
  /** Extra radial/side breakdown from the primary length + λ (+ ground system). */
  dims: (primaryM: number, lambdaM: number, k: number, groundSystem?: GroundSystem) => Dim[];
}
