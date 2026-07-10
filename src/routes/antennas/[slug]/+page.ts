import { error } from '@sveltejs/kit';
import { antennaModels } from '$lib/registry';
import { ANTENNA_DESIGNS } from '$lib/antennas/models';
import type { EntryGenerator, PageLoad } from './$types';

// One route serves every Antenna Model: the shared Designer when a closed-form
// design spec exists (Tier 1), otherwise the not-built-yet stub.
export const entries: EntryGenerator = () => antennaModels.map((m) => ({ slug: m.slug }));

export const load: PageLoad = ({ params }) => {
  const model = antennaModels.find((m) => m.slug === params.slug);
  if (!model) error(404, 'Unknown antenna model');
  return { model, hasDesign: params.slug in ANTENNA_DESIGNS };
};
