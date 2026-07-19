// The 24-calculator registry: the single source of truth for nav menus,
// route entries (adapter-static prerender), and index listings.
// Antenna Models (Designers, /antennas/*) + Engineering Tools (/tools/*).
// Sourced from .scratch/portal/assets/{antenna-models,engineering-tools}-list.md
// (ADR-0005 method+citation, ADR-0002 first-principles).

export type DesignMethod = 'closed-form' | 'published-design' | 'exact';
export type Tier = 1 | 2 | 3;
export type BuildStatus = 'planned' | 'building' | 'live';

export interface AntennaModel {
  slug: string;
  name: string;
  method: DesignMethod;
  source: string;
  tier: Tier;
  /** Offers the "shorten & load" deep-link into the Loading Coil (ADR-0007). */
  loadable?: boolean;
  status: BuildStatus;
}

export interface EngineeringTool {
  slug: string;
  name: string;
  /** exact tools declare no Design Method / Accuracy Note. */
  exact: boolean;
  method?: DesignMethod;
  formula: string;
  status: BuildStatus;
}

export const antennaModels: AntennaModel[] = [
  // Tier 1 — closed-form staples (share the λ = c/f × k engine)
  { slug: 'half-wave-dipole', name: 'Half-Wave Dipole', method: 'closed-form', source: 'ARRL Antenna Book', tier: 1, loadable: true, status: 'live' },
  { slug: 'inverted-v-dipole', name: 'Inverted-V Dipole', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'folded-dipole', name: 'Folded Dipole', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'quarter-wave-vertical', name: 'Quarter-Wave Vertical / Ground-Plane', method: 'closed-form', source: 'ARRL', tier: 1, loadable: true, status: 'live' },
  { slug: 'half-wave-vertical', name: 'Half-Wave Vertical', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'five-eighths-wave-vertical', name: '5/8-Wave Vertical', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'end-fed-half-wave', name: 'End-Fed Half-Wave (EFHW)', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'full-wave-loop', name: 'Full-Wave Loop (Quad)', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'delta-loop', name: 'Delta Loop', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  { slug: 'random-long-wire', name: 'Random / Long Wire', method: 'closed-form', source: 'ARRL', tier: 1, status: 'live' },
  // Tier 2 — published-design
  { slug: 'yagi-uda', name: 'Yagi-Uda', method: 'published-design', source: 'DL6WU / NBS TN-688', tier: 2, status: 'live' },
  { slug: 'moxon-rectangle', name: 'Moxon Rectangle', method: 'published-design', source: 'Moxon / Cebik', tier: 2, status: 'live' },
  { slug: 'j-pole-slim-jim', name: 'J-Pole / Slim Jim', method: 'published-design', source: 'matching-section dimensions', tier: 2, status: 'live' },
  // Tier 3 — complex / niche
  { slug: 'magnetic-loop', name: 'Magnetic Loop (Small Transmitting Loop)', method: 'closed-form', source: 'own research', tier: 3, status: 'planned' },
  { slug: 'discone', name: 'Discone', method: 'published-design', source: 'own research', tier: 3, status: 'planned' },
  { slug: 'g5rv', name: 'G5RV', method: 'published-design', source: 'published', tier: 3, status: 'planned' },
  { slug: 'off-center-fed-dipole', name: 'Off-Center-Fed Dipole (Windom)', method: 'published-design', source: 'published', tier: 3, status: 'planned' }
];

export const engineeringTools: EngineeringTool[] = [
  // Exact one-liners
  { slug: 'wavelength', name: 'Wavelength', exact: true, formula: 'λ = c / f (× VF for physical)', status: 'live' },
  { slug: 'velocity-factor', name: 'Velocity Factor', exact: true, formula: 'VF = v / c', status: 'live' },
  { slug: 'resonant-frequency', name: 'Resonant Frequency', exact: true, formula: 'f = 1 / (2π√LC)', status: 'live' },
  { slug: 'balun-ratio', name: 'Balun Ratio', exact: true, formula: 'n = √(Z_out / Z_in)', status: 'live' },
  { slug: 'swr', name: 'SWR', exact: true, formula: 'SWR = (1 + |Γ|) / (1 − |Γ|)', status: 'live' },
  // Approximating — declare Design Method + Accuracy Note
  { slug: 'feed-line-loss', name: 'Feed Line Loss', exact: false, method: 'published-design', formula: 'matched loss + SWR-added loss (dB)', status: 'live' },
  { slug: 'bandwidth', name: 'Bandwidth', exact: false, method: 'closed-form', formula: 'BW = f / Q', status: 'live' },
  { slug: 'loading-coil', name: 'Loading Coil', exact: false, method: 'closed-form', formula: 'X = −Zc·cot(βℓ) + Nagaoka geometry', status: 'live' }
];

export const tiers: Record<Tier, string> = {
  1: 'Tier 1 · closed-form staples',
  2: 'Tier 2 · published-design',
  3: 'Tier 3 · complex / niche'
};

export function antennasByTier(): { tier: Tier; label: string; models: AntennaModel[] }[] {
  return ([1, 2, 3] as Tier[]).map((tier) => ({
    tier,
    label: tiers[tier],
    models: antennaModels.filter((m) => m.tier === tier)
  }));
}
