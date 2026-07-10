import { error } from '@sveltejs/kit';
import { antennaModels } from '$lib/registry';
import { ANTENNA_DESIGNS } from '$lib/antennas/models';
import { TIER2_DESIGNS } from '$lib/antennas/tier2';
import type { EntryGenerator, PageLoad } from './$types';

// One route serves every Antenna Model: the shared Tier-1 Designer (closed-form
// λ×k) or the Tier-2 Designer (published-design), otherwise the not-built stub.
export const entries: EntryGenerator = () => antennaModels.map((m) => ({ slug: m.slug }));

export const load: PageLoad = ({ params }) => {
  const model = antennaModels.find((m) => m.slug === params.slug);
  if (!model) error(404, 'Unknown antenna model');
  return {
    model,
    hasDesign: params.slug in ANTENNA_DESIGNS,
    hasTier2: params.slug in TIER2_DESIGNS
  };
};
