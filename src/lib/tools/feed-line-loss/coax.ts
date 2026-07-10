// Digitized coax-loss dataset (the tool's embedded data asset, like the Loading
// Coil's Medhurst table). Matched loss per 100 ft modelled as the standard
// two-term fit α(dB) = k1·√f + k2·f (f in MHz): k1 = conductor/skin loss,
// k2 = dielectric loss. Coefficients fitted from published matched-loss curves
// (ARRL Antenna Book / Times Microwave & Belden datasheets) at 10 and 400 MHz.
// Advisory-grade: real cable loss drifts with age, temperature, and batch.

export interface Coax {
  key: string;
  name: string;
  z0: number; // nominal Ω
  vf: number; // velocity factor (reference)
  k1: number; // dB/100 ft · MHz^-0.5
  k2: number; // dB/100 ft · MHz^-1
}

export const COAX: Coax[] = [
  { key: 'rg58', name: 'RG-58', z0: 50, vf: 0.66, k1: 0.394, k2: 0.0053 },
  { key: 'rg8x', name: 'RG-8X', z0: 50, vf: 0.82, k1: 0.309, k2: 0.0023 },
  { key: 'rg213', name: 'RG-213 / RG-8U', z0: 50, vf: 0.66, k1: 0.168, k2: 0.00185 },
  { key: 'lmr400', name: 'LMR-400', z0: 50, vf: 0.85, k1: 0.0836, k2: 0.0006 },
  { key: 'rg6', name: 'RG-6', z0: 75, vf: 0.82, k1: 0.185, k2: 0.0015 },
  { key: 'rg11', name: 'RG-11', z0: 75, vf: 0.84, k1: 0.1305, k2: 0.00073 },
  { key: 'rg174', name: 'RG-174', z0: 50, vf: 0.66, k1: 0.573, k2: 0.0088 },
  { key: 'ladder450', name: '450 Ω window ladder line', z0: 450, vf: 0.91, k1: 0.00563, k2: 0.000218 }
];

export const coaxByKey = (key: string): Coax => COAX.find((c) => c.key === key) ?? COAX[0];

/** Matched loss in dB per 100 ft at frequency f (MHz). */
export function matchedLossPer100ft(c: Coax, fMHz: number): number {
  return c.k1 * Math.sqrt(fMHz) + c.k2 * fMHz;
}
