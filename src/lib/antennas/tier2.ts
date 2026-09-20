// Tier-2 published-design Antenna Models (ADR-0005). Unlike the Tier-1 λ×k
// staples, these carry model-specific published geometry, so each has its own
// compute. Values are cited starting designs — optimise/verify in NEC.

import { wavelength } from '$lib/physics/wavelength';
import type { Dim, Shape } from './types';

export type Tier2Slug = 'yagi-uda' | 'moxon-rectangle' | 'j-pole-slim-jim' | 'dual-band-collinear';
export type JVariant = 'jpole' | 'slimjim' | 'superj';

export interface Tier2Inputs {
  fMHz: number;
  k: number; // trim / velocity factor, exposed
  elements?: number; // Yagi total elements (3–6)
  variant?: JVariant; // J-Pole vs Slim Jim
  f2MHz?: number; // Dual-Band Collinear: UHF design frequency (fMHz is the VHF one)
  vf?: number; // Dual-Band Collinear: phasing-coil (coax) velocity factor
}

export interface Extra {
  label: string;
  value: string;
}

export interface Tier2Result {
  lambdaM: number;
  lambdaM2?: number; // second wavelength for dual-band models
  shape: Shape | 'yagi' | 'moxon' | 'jpole' | 'collinear';
  dims: Dim[];
  extras: Extra[]; // gain, F/B, boom, feed tap …
  feed: string;
  notes: string[];
}

const f2 = (n: number, dp = 3) => Number(n.toFixed(dp));

// ---- Yagi-Uda (DL6WU / ARRL family, parametric) ----
export function computeYagi(i: Tier2Inputs): Tier2Result {
  const lambda = wavelength(i.fMHz);
  const N = Math.min(Math.max(Math.round(i.elements ?? 3), 3), 6);
  const k = i.k;

  const reflector = 0.496 * lambda * k;
  const driven = 0.472 * lambda * k;
  const nDir = N - 2;

  const dims: Dim[] = [
    { label: 'Reflector', m: reflector, key: 'refl' },
    { label: 'Driven element', m: driven, key: 'de' }
  ];
  const directorLen = (idx: number) => Math.max(0.42, 0.442 - 0.004 * idx) * lambda * k;
  for (let d = 0; d < nDir; d++) {
    dims.push({ label: `Director ${d + 1}`, m: directorLen(d), key: `d${d + 1}` });
  }

  // Boom: reflector→driven 0.15λ, then each director 0.2λ.
  const boom = (0.15 + 0.2 * nDir) * lambda;
  const gainDbi = 6.0 + (N - 2) * 1.1; // estimate

  return {
    lambdaM: lambda,
    shape: 'yagi',
    dims,
    extras: [
      { label: 'Boom length', value: `${f2(boom, 3)} m` },
      { label: 'Elements', value: String(N) },
      { label: 'Gain (est)', value: `≈ ${gainDbi.toFixed(1)} dBi` },
      { label: 'Refl→DE spacing', value: `${f2(0.15 * lambda, 3)} m` },
      { label: 'Director spacing', value: `${f2(0.2 * lambda, 3)} m` }
    ],
    feed: '~20–30 Ω — match with a gamma, hairpin, or beta match to 50 Ω.',
    notes: [
      'A parametric starting design — element lengths shift with boom and element diameter.',
      'Optimise and verify gain / F-B in an antenna modeller (NEC) before building.'
    ]
  };
}

// ---- Moxon Rectangle (Cebik / Moxon) ----
export function computeMoxon(i: Tier2Inputs): Tier2Result {
  const lambda = wavelength(i.fMHz);
  const k = i.k;
  const A = 0.375 * lambda * k; // width
  const B = 0.0575 * lambda * k; // driven tail
  const C = 0.007 * lambda * k; // tip gap
  const D = 0.0675 * lambda * k; // reflector tail
  const depth = B + C + D;

  return {
    lambdaM: lambda,
    shape: 'moxon',
    dims: [
      { label: 'Width A', m: A, key: 'A' },
      { label: 'Driven tail B', m: B, key: 'B' },
      { label: 'Gap C', m: C, key: 'C' },
      { label: 'Reflector tail D', m: D, key: 'D' },
      { label: 'Depth (B+C+D)', m: depth, key: 'depth' }
    ],
    extras: [
      { label: 'Gain (est)', value: '≈ 5–6 dBi' },
      { label: 'Front/back', value: '≈ 20 dB' }
    ],
    feed: '~50 Ω at the driven element — feeds coax directly (1:1 balun).',
    notes: [
      'Compact 2-element beam; the bent tips give a deep rearward null.',
      'Dimensions are for thin wire — trim the gap C to peak the front-to-back.'
    ]
  };
}

// ---- J-Pole / Slim Jim ----
export function computeJPole(i: Tier2Inputs): Tier2Result {
  const lambda = wavelength(i.fMHz);
  const vf = i.k; // tubing velocity factor (~0.95)
  const variant: JVariant = i.variant ?? 'jpole';
  const isSuperJ = variant === 'superj';

  const radiator = 0.5 * lambda * vf; // half-wave radiator (lower, for Super J)
  const stub = 0.25 * lambda * vf; // quarter-wave matching stub
  const phasingStub = 0.25 * lambda * vf; // Super J only: ¼λ phasing stub
  const upperRadiator = 0.5 * lambda * vf; // Super J only: second ½λ radiator
  const overall = isSuperJ ? stub + radiator + phasingStub + upperRadiator : radiator + stub;
  const feedTap = 0.035 * lambda * vf; // from the bottom, adjust for lowest SWR
  const spacing = 0.02 * lambda; // between the two parallel conductors

  const dims: Dim[] = [
    { label: isSuperJ ? 'Lower radiator (½λ)' : 'Radiator (½λ)', m: radiator, key: 'rad' },
    { label: 'Matching stub (¼λ)', m: stub, key: 'stub' }
  ];
  if (isSuperJ) {
    dims.push(
      { label: 'Phasing stub (¼λ)', m: phasingStub, key: 'phase' },
      { label: 'Upper radiator (½λ)', m: upperRadiator, key: 'rad2' }
    );
  }
  dims.push(
    { label: 'Overall height', m: overall, key: 'H' },
    { label: 'Feed tap from bottom', m: feedTap, key: 'tap' },
    { label: 'Conductor spacing', m: spacing, key: 'gap' }
  );

  const variantLabel =
    variant === 'slimjim' ? 'Slim Jim (J integrated match)' : isSuperJ ? 'Super J (collinear J)' : 'J-Pole';
  const gain =
    variant === 'slimjim'
      ? '≈ 6 dBi'
      : isSuperJ
        ? '≈ 5.5–6 dBi (≈ 2.5–3 dBd over a plain J-Pole)'
        : '≈ 3 dBi (½λ + gnd)';

  return {
    lambdaM: lambda,
    shape: 'jpole',
    dims,
    extras: [
      { label: 'Variant', value: variantLabel },
      { label: 'Gain (est)', value: gain }
    ],
    feed: '~50 Ω at the tap — slide the feed point up/down the stub for lowest SWR.',
    notes: [
      isSuperJ
        ? 'Super J: two half-wave radiators stacked and phased in line by a ¼λ stub — collinear gain over a plain J-Pole.'
        : variant === 'slimjim'
          ? 'Slim Jim: a folded half-wave radiator with a J matching stub — lower angle than a plain J-Pole.'
          : 'J-Pole: a half-wave radiator end-matched by a quarter-wave stub; no radials needed.',
      'Set velocity factor for your tubing (~0.95). Tap position and spacing are tuned for minimum SWR.'
    ]
  };
}

// ---- Dual-Band Collinear (2m / 70cm+GMRS): ½λ VHF + phasing coil + ½λ UHF ----
export function computeDualBandCollinear(i: Tier2Inputs): Tier2Result {
  const lambda1 = wavelength(i.fMHz);
  const lambda2 = wavelength(i.f2MHz ?? 448.5);
  const k = i.k; // radiator (tubing / wire) correction
  const vf = i.vf ?? 0.66; // phasing-coil coax velocity factor

  const vhf = 0.5 * lambda1 * k;
  const uhf = 0.5 * lambda2 * k;
  const coil = 0.5 * lambda2 * vf; // half-wave phasing section, cut at f2
  const overall = vhf + coil + uhf;

  return {
    lambdaM: lambda1,
    lambdaM2: lambda2,
    shape: 'collinear',
    dims: [
      { label: 'VHF radiator (½λ)', m: vhf, key: 'vhf' },
      { label: 'UHF radiator (½λ)', m: uhf, key: 'uhf' },
      { label: 'Phasing coil (½λ, coax)', m: coil, key: 'coil' },
      { label: 'Overall height', m: overall, key: 'H' }
    ],
    extras: [
      { label: 'Gain (est)', value: '≈ 3–5 dBi (a few dB over a single dipole)' },
      { label: 'Ground plane', value: 'none needed' }
    ],
    feed: 'Roughly 50 Ω region at the base — expect to match and trim on the bench.',
    notes: [
      'End-fed collinear: no radials or ground plane needed.',
      'The phasing coil is coiled coax, not a radiating element — its length uses the coax VF, not the radiator k.',
      'One UHF element covers 430–467 MHz (70cm and GMRS); retune f2 alone to centre on either slice.'
    ]
  };
}

export interface Tier2Design {
  slug: Tier2Slug;
  name: string;
  cite: string;
  accuracy: string;
  kLabel: string;
  defaultK: number;
  hasElements?: boolean;
  hasVariant?: boolean;
  /** Dual-band: adds a second frequency (f2) and a phasing-coil VF input. */
  dual?: { defaultF1: number; defaultF2: number; defaultVf: number };
  compute: (i: Tier2Inputs) => Tier2Result;
}

export const TIER2_DESIGNS: Record<Tier2Slug, Tier2Design> = {
  'yagi-uda': {
    slug: 'yagi-uda',
    name: 'Yagi-Uda',
    cite: 'DL6WU / NBS TN-688 / ARRL',
    accuracy: 'Parametric starting design — optimise in NEC; ±few % on lengths.',
    kLabel: 'trim k',
    defaultK: 0.97,
    hasElements: true,
    compute: computeYagi
  },
  'moxon-rectangle': {
    slug: 'moxon-rectangle',
    name: 'Moxon Rectangle',
    cite: 'Cebik (W4RNL) / Moxon',
    accuracy: '±~2% on dimensions for thin wire; trim gap C to peak F/B.',
    kLabel: 'trim k',
    defaultK: 1.0,
    compute: computeMoxon
  },
  'j-pole-slim-jim': {
    slug: 'j-pole-slim-jim',
    name: 'J-Pole / Slim Jim',
    cite: 'Published J-antenna / collinear-J dimensions',
    accuracy: 'Starting dimensions — tune the tap and matching/phasing stub(s) for lowest SWR.',
    kLabel: 'velocity factor',
    defaultK: 0.95,
    hasVariant: true,
    compute: computeJPole
  },
  'dual-band-collinear': {
    slug: 'dual-band-collinear',
    name: 'Dual-Band Collinear (2m / 70cm+GMRS)',
    cite: 'ARRL Antenna Book / Kraus — collinear phased arrays',
    accuracy:
      'Starting design. The UHF section spans 430–467 MHz as one element and is not verified across that whole range — check SWR bandwidth in NEC or on the bench before building.',
    kLabel: 'radiator k',
    defaultK: 0.96,
    dual: { defaultF1: 145, defaultF2: 448.5, defaultVf: 0.66 },
    compute: computeDualBandCollinear
  }
};

export const TIER2_SLUGS = Object.keys(TIER2_DESIGNS) as Tier2Slug[];
