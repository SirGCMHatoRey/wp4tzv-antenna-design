// The 10 Tier-1 closed-form Antenna Models as data (antenna-models-list).
// Every dimension is length = factor · λ · k with the correction factor exposed
// (ADR-0002); each declares its method-cite + honest Accuracy Note (ADR-0005).

import type { AntennaDesign, Dim, GroundSystem } from './types';
import { radialDim } from './ground';

const dipoleDims = (p: number): Dim[] => [
  { label: 'Total length', m: p, key: 'L' },
  { label: 'Each leg (from center)', m: p / 2, key: 'leg' }
];

/** Radiator + optional radial breakdown, shared by every ground-aware vertical. */
const verticalDims =
  (defaultGround: GroundSystem) =>
  (p: number, lambda: number, _k: number, g: GroundSystem = defaultGround): Dim[] => {
    const radial = radialDim(lambda, g);
    return radial ? [{ label: 'Radiator', m: p, key: 'rad' }, radial] : [{ label: 'Radiator', m: p, key: 'rad' }];
  };

export const ANTENNA_DESIGNS: Record<string, AntennaDesign> = {
  'half-wave-dipole': {
    slug: 'half-wave-dipole',
    name: 'Half-Wave Dipole',
    shape: 'dipole',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95: velocity + end-effect on a thin wire half-wave.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~2%, cut a little long and trim to resonance.',
    feed: '~73 Ω (1:1 balun to 50 Ω coax).',
    notes: ['Center-fed, halves fed against each other.', 'Height ≥ λ/4 for a usable low-angle pattern.'],
    loadable: true,
    dims: dipoleDims
  },
  'inverted-v-dipole': {
    slug: 'inverted-v-dipole',
    name: 'Inverted-V Dipole',
    shape: 'dipole',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95; the apex droop shortens resonance slightly (auto-corrected).',
    cite: 'ARRL Antenna Book',
    accuracy: '±~3%; apex angle shifts resonance — trim to resonance.',
    feed: '~50 Ω at a ~90–120° included angle (1:1 balun).',
    notes: ['Single center support; ends drop toward ground.', 'Lower feed impedance than a flat dipole — handy for 50 Ω.'],
    hasApex: true,
    dims: dipoleDims
  },
  'folded-dipole': {
    slug: 'folded-dipole',
    name: 'Folded Dipole',
    shape: 'dipole',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95 as a plain half-wave; the fold sets impedance, not length.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~2%, trim to resonance.',
    feed: '~300 Ω (4:1 balun → 75 Ω, or use 300 Ω line).',
    notes: ['Two parallel conductors shorted at the ends.', 'Wider bandwidth than a single-wire dipole.'],
    dims: (p) => [...dipoleDims(p), { label: 'Conductor spacing', m: 0.02, key: 'gap' }]
  },
  'quarter-wave-vertical': {
    slug: 'quarter-wave-vertical',
    name: 'Quarter-Wave Vertical / Ground-Plane',
    shape: 'vertical',
    factor: 0.25,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95 on the radiator; radials run near λ/4 physical.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~3%, trim to resonance; ground/radials shift feed Z.',
    feed: '~36 Ω over good ground (rises toward 50 Ω when elevated).',
    notes: ['Needs radials or a ground plane as the missing half.', 'Shorten & load with the Loading Coil for a mobile whip.'],
    loadable: true,
    ground: {
      options: ['elevated-radials', 'ground-radials', 'none'],
      default: 'elevated-radials',
      text: {
        'elevated-radials': {
          feed: '~36 Ω over an elevated ground plane (rises toward 50 Ω well clear of earth).',
          notes: [
            '4 elevated, resonant λ/4 radials form the missing half of the antenna.',
            'Shorten & load with the Loading Coil for a mobile whip.'
          ],
          accuracy: '±~3%, trim to resonance; an elevated ground plane gets you close to the stated feed Z.'
        },
        'ground-radials': {
          feed: '~30–35 Ω over a many-radial buried ground screen — closer to earth, more loss than elevated.',
          notes: [
            'Many shorter buried radials beat a few long ones for a ground-mounted base (Severns).',
            'Shorten & load with the Loading Coil for a mobile whip.'
          ],
          accuracy: '±~5%, trim to resonance; a buried ground screen adds efficiency uncertainty beyond the radiator length.'
        },
        none: {
          feed: 'High and unpredictable — ground loss dominates with no radial/counterpoise return.',
          notes: [
            'No radials or counterpoise — expect a real efficiency penalty. Add at least one before trusting these numbers.',
            'Shorten & load with the Loading Coil for a mobile whip.'
          ],
          accuracy:
            '±~3% on the radiator length alone — but real-world efficiency is unpredictable without a ground return. Trim to resonance, then measure.'
        }
      }
    },
    dims: verticalDims('elevated-radials')
  },
  'five-eighths-wave-vertical': {
    slug: 'five-eighths-wave-vertical',
    name: '5/8-Wave Vertical',
    shape: 'vertical',
    factor: 0.625,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95 on the 0.625 λ radiator.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~3%; needs a base matching network — trim to resonance.',
    feed: 'Capacitive — a base loading coil / L-network matches to 50 Ω.',
    notes: ['Lower radiation angle and gain over a ¼-wave.', 'Requires a matching coil at the base; radials still needed.'],
    ground: {
      options: ['elevated-radials', 'ground-radials', 'none'],
      default: 'elevated-radials',
      text: {
        'elevated-radials': {
          feed: 'Capacitive — a base loading coil / L-network matches to 50 Ω.',
          notes: [
            'Requires a matching coil at the base regardless of ground system.',
            '4 elevated, resonant λ/4 radials form the missing half of the antenna.'
          ],
          accuracy: '±~3%; needs a base matching network — trim to resonance.'
        },
        'ground-radials': {
          feed: 'Capacitive — a base loading coil / L-network matches to 50 Ω.',
          notes: [
            'Requires a matching coil at the base regardless of ground system.',
            'Many shorter buried radials beat a few long ones for a ground-mounted base (Severns).'
          ],
          accuracy: '±~3%; needs a base matching network — trim to resonance.'
        },
        none: {
          feed: 'Capacitive and lossy — a base matching network alone will not recover the ground loss with no radial return.',
          notes: [
            'Requires a matching coil at the base regardless of ground system.',
            'No radials or counterpoise — the matching network cannot compensate for missing ground return. Add at least one radial.'
          ],
          accuracy: '±~3% on the radiator length alone — real-world efficiency is unpredictable without a ground return.'
        }
      }
    },
    dims: verticalDims('elevated-radials')
  },
  'half-wave-vertical': {
    slug: 'half-wave-vertical',
    name: 'Half-Wave Vertical',
    shape: 'vertical',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95 for the end-fed half-wave wire, same basis as the flat half-wave dipole.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~3%, trim to resonance; feed impedance is high regardless of ground system.',
    feed: '~2000–4000 Ω, high and reactive at the base — needs a matching network, not a ground plane.',
    notes: [
      'No ground plane or radial field required — the feedpoint carries little current.',
      'Fed at a high-impedance point; needs a base matching network (L-network or unun).'
    ],
    ground: {
      options: ['elevated-radials', 'ground-radials', 'none'],
      default: 'none',
      text: {
        'elevated-radials': {
          feed: '~2000–4000 Ω, high and reactive at the base — needs a matching network, not a ground plane.',
          notes: [
            'A ground system is optional here and makes little practical difference to this design.',
            'Fed at a high-impedance point; needs a base matching network (L-network or unun).'
          ],
          accuracy: '±~3%, trim to resonance; feed impedance is high regardless of ground system.'
        },
        'ground-radials': {
          feed: '~2000–4000 Ω, high and reactive at the base — needs a matching network, not a ground plane.',
          notes: [
            'A ground system is optional here and makes little practical difference to this design.',
            'Fed at a high-impedance point; needs a base matching network (L-network or unun).'
          ],
          accuracy: '±~3%, trim to resonance; feed impedance is high regardless of ground system.'
        },
        none: {
          feed: '~2000–4000 Ω, high and reactive at the base — needs a matching network, not a ground plane.',
          notes: [
            'No ground plane or radial field required — the feedpoint carries little current.',
            'Fed at a high-impedance point; needs a base matching network (L-network or unun).'
          ],
          accuracy: '±~3%, trim to resonance; feed impedance is high regardless of ground system.'
        }
      }
    },
    dims: verticalDims('none')
  },
  'end-fed-half-wave': {
    slug: 'end-fed-half-wave',
    name: 'End-Fed Half-Wave (EFHW)',
    shape: 'wire',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'k ≈ 0.95 for the half-wave wire.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~2%, trim to resonance at the far end.',
    feed: '~2500 Ω at the end (49:1 unun → 50 Ω).',
    notes: ['Fed at a high-voltage end point.', 'A short counterpoise tames common-mode current.'],
    dims: (p) => [{ label: 'Total length', m: p, key: 'L' }]
  },
  'full-wave-loop': {
    slug: 'full-wave-loop',
    name: 'Full-Wave Loop (Quad)',
    shape: 'loop',
    factor: 1.02,
    defaultK: 1.0,
    kBasis: 'Perimeter runs ≈2% long (factor 1.02); k trims from there.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~2% on perimeter, trim to resonance.',
    feed: '~110–125 Ω (1:1 or 2:1 balun).',
    notes: ['Square loop, one wavelength around.', 'Slight gain and a quieter receive than a dipole.'],
    loopSides: 4,
    dims: (p) => [
      { label: 'Perimeter', m: p, key: 'peri' },
      { label: 'Each side ×4', m: p / 4, key: 'side' }
    ]
  },
  'delta-loop': {
    slug: 'delta-loop',
    name: 'Delta Loop',
    shape: 'loop',
    factor: 1.02,
    defaultK: 1.0,
    kBasis: 'Perimeter ≈2% long (factor 1.02); k trims from there.',
    cite: 'ARRL Antenna Book',
    accuracy: '±~2% on perimeter, trim to resonance.',
    feed: '~100 Ω (or match a corner feed to 50 Ω).',
    notes: ['Triangular loop, one wavelength around.', 'Apex-up or apex-down; a single high support works.'],
    loopSides: 3,
    dims: (p) => [
      { label: 'Perimeter', m: p, key: 'peri' },
      { label: 'Each side ×3', m: p / 3, key: 'side' }
    ]
  },
  'random-long-wire': {
    slug: 'random-long-wire',
    name: 'Random / Long Wire',
    shape: 'wire',
    factor: 0.5,
    defaultK: 0.95,
    kBasis: 'Non-resonant by design; the half-wave figure is the length to avoid.',
    cite: 'ARRL Antenna Book',
    accuracy: 'Not a resonant cut — match with a tuner.',
    feed: 'High and reactive — feed through an antenna tuner (a 9:1 unun helps an end-fed random wire).',
    notes: [
      'A random wire is deliberately not resonant; a tuner does the matching.',
      'Avoid exact half-wave multiples of your bands (shown) — they present an awkward high impedance.',
      'Longer is generally better; add a counterpoise/radial.'
    ],
    dims: (p) => [{ label: 'Half-wave to avoid', m: p, key: 'avoid' }]
  }
};

export const TIER1_SLUGS = Object.keys(ANTENNA_DESIGNS);
