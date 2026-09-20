import { describe, it, expect } from 'vitest';
import { parse as parseCoil, serialize as serializeCoil } from '$lib/tools/loading-coil/codec';
import { DEFAULTS } from '$lib/tools/loading-coil/defaults';
import { designerLinkSchema, parseDesignerLink, serializeDesignerLink } from '$lib/antennas/designer-link';
import { tier2LinkSchema, parseTier2Link, serializeTier2Link } from '$lib/antennas/tier2-link';
import { outboundUrl, parseAntennaContext } from '$lib/antennas/coil-handoff';
import { ANTENNA_DESIGNS } from '$lib/antennas/models';
import { TIER2_DESIGNS } from '$lib/antennas/tier2';

// One Shareable Link mechanism, three surfaces (issue #16): `f` is the same
// key, the same type (a number) and the same unit (MHz) everywhere.
describe('`f` means the same thing on every surface', () => {
  const design = ANTENNA_DESIGNS['half-wave-dipole'];
  const tier2 = TIER2_DESIGNS['moxon-rectangle'];

  it('schemas declare f as a numeric param', () => {
    expect(designerLinkSchema.params.f.type).toBe('num');
    expect(tier2LinkSchema.params.f.type).toBe('num');
  });

  it('the same `f=14.2` link resolves to 14.2 MHz on all three', () => {
    expect(parseCoil('f=14.2').fMHz).toBe(14.2);
    expect(parseDesignerLink('f=14.2', design, { fMHz: 1, k: 1 }).fMHz).toBe(14.2);
    expect(parseTier2Link('f=14.2', tier2, { fMHz: 1, k: 1 }).fMHz).toBe(14.2);
  });

  it('every surface writes f under the same key, as MHz', () => {
    const coil = new URLSearchParams(serializeCoil({ ...DEFAULTS, fMHz: 14.2 }));
    const des = new URLSearchParams(serializeDesignerLink({ fMHz: 14.2, k: 1, apexDeg: 120, groundSystem: 'none' }, design));
    const t2 = new URLSearchParams(
      serializeTier2Link({ fMHz: 14.2, k: 1, elements: 3, variant: 'jpole', f2MHz: 0, vf: 0 }, tier2)
    );
    for (const q of [coil, des, t2]) expect(q.get('f')).toBe('14.2');
  });

  it('every surface tags its link with a version', () => {
    const t = (qs: string) => new URLSearchParams(qs).get('v');
    expect(t(serializeCoil(DEFAULTS))).toBe('1');
    expect(t(serializeDesignerLink({ fMHz: 7, k: 1, apexDeg: 120, groundSystem: 'none' }, design))).toBe('1');
    expect(
      t(serializeTier2Link({ fMHz: 7, k: 1, elements: 3, variant: 'jpole', f2MHz: 0, vf: 0 }, tier2))
    ).toBe('1');
  });
});

describe('shorten-and-load handoff spans Tier-1 Designer → Loading Coil', () => {
  it('a Designer-emitted handoff resolves to a pre-filled Loading Coil state', () => {
    const ctx = parseAntennaContext('slug=quarter-wave-vertical&k=0.95')!;
    const q = new URLSearchParams(outboundUrl('', ctx, { fMHz: 7.15, hM: 1.5 }).split('?')[1]);
    expect(parseCoil(q)).toMatchObject({ fMHz: 7.15, pos: 'base', units: 'metric' });
    expect(parseCoil(q).H).toBeCloseTo(1.5, 6);
  });
});
