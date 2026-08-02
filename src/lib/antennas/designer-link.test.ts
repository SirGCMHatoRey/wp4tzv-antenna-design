import { describe, it, expect } from 'vitest';
import { num, parse as codecParse, type LinkSchema } from '$lib/shareable-link';
import { designerLinkSchema, parseDesignerLink, serializeDesignerLink } from './designer-link';
import { ANTENNA_DESIGNS } from './models';
import type { AntennaDesign } from './types';

const plainModel = ANTENNA_DESIGNS['half-wave-dipole']; // no apex, no ground
const apexModel = ANTENNA_DESIGNS['inverted-v-dipole']; // hasApex, no ground
const groundModel = ANTENNA_DESIGNS['quarter-wave-vertical']; // ground, no apex

// ---------- Golden-string back-compat (issue #14) ----------
//
// These pin the exact link shape the old hand-rolled onMount/$effect in
// Designer.svelte published before this migration:
//   $effect(() => {
//     q.set('f', String(Number(fMHz)));
//     q.set('k', String(Number(k)));
//     if (design.hasApex) q.set('apex', String(Number(apexDeg)));
//     if (design.ground) q.set('g', groundSystem);
//   });
// i.e. always f & k, apex only for hasApex models, g only for ground models,
// and — critically — no `v=` version param (that's new with the shared
// codec; parse must still resolve these old, unversioned links correctly).
describe('golden-string back-compat: pre-migration published link shapes', () => {
  it('a plain model link (f & k only) resolves to the published state', () => {
    const r = parseDesignerLink('?f=7.15&k=0.95', plainModel, { fMHz: 7.15, k: plainModel.defaultK });
    expect(r).toEqual({ fMHz: 7.15, k: 0.95, apexDeg: 120, groundSystem: 'none' });
  });

  it('an apex model link (f, k, apex) resolves to the published state', () => {
    const r = parseDesignerLink('?f=7.15&k=0.95&apex=90', apexModel, { fMHz: 7.15, k: apexModel.defaultK });
    expect(r).toEqual({ fMHz: 7.15, k: 0.95, apexDeg: 90, groundSystem: 'none' });
  });

  it('a ground-system model link (f, k, g) resolves to the published state', () => {
    const r = parseDesignerLink('?f=7.15&k=0.95&g=elevated-radials', groundModel, {
      fMHz: 7.15,
      k: groundModel.defaultK
    });
    expect(r).toEqual({ fMHz: 7.15, k: 0.95, apexDeg: 120, groundSystem: 'elevated-radials' });
  });

  it('a ground-system model link explicitly opting out of radials round-trips "none"', () => {
    const r = parseDesignerLink('?f=14.2&k=0.95&g=none', groundModel, { fMHz: 14.2, k: groundModel.defaultK });
    expect(r.groundSystem).toBe('none');
  });
});

// ---------- Fallbacks for absent params (not the schema's static default) ----------
describe('absent params fall back to the caller-supplied context, not the schema default', () => {
  it('absent f falls back to the live center-frequency store value, not schema default 7.15', () => {
    const r = parseDesignerLink('?k=0.95', plainModel, { fMHz: 14.2, k: plainModel.defaultK });
    expect(r.fMHz).toBe(14.2);
  });

  it("absent k falls back to the model's own defaultK, not the schema default", () => {
    const r = parseDesignerLink('?f=7.15', groundModel, { fMHz: 7.15, k: groundModel.defaultK });
    expect(r.k).toBe(groundModel.defaultK);
  });

  it("absent g (ground-capable model) falls back to the model's own ground.default", () => {
    // half-wave-vertical defaults to 'none'; quarter-wave-vertical to 'elevated-radials'.
    const hwv = ANTENNA_DESIGNS['half-wave-vertical'];
    const r = parseDesignerLink('?f=7.15&k=0.95', hwv, { fMHz: 7.15, k: hwv.defaultK });
    expect(r.groundSystem).toBe('none');
    expect(hwv.ground?.default).toBe('none');

    const r2 = parseDesignerLink('?f=7.15&k=0.95', groundModel, { fMHz: 7.15, k: groundModel.defaultK });
    expect(r2.groundSystem).toBe('elevated-radials');
  });

  it('a garbled/empty link resolves totally, never throws, all params fall back', () => {
    expect(() => parseDesignerLink('not a real query ??==&&', groundModel, { fMHz: 7.15, k: 0.95 })).not.toThrow();
    const r = parseDesignerLink('', groundModel, { fMHz: 7.15, k: 0.95 });
    expect(r).toEqual({ fMHz: 7.15, k: 0.95, apexDeg: 120, groundSystem: 'elevated-radials' });
  });
});

// ---------- Conditional params: absent from parse reads and from serialize ----------
describe('apex is scoped to hasApex models; g is scoped to ground-capable models (issue #4)', () => {
  it('apex is not read for a non-apex model even if the link carries it', () => {
    const r = parseDesignerLink('?f=7.15&k=0.95&apex=90', plainModel, { fMHz: 7.15, k: 0.95 });
    expect(r.apexDeg).toBe(120); // schema default — the explicit 90 must be ignored
  });

  it('g is not read for a non-ground model even if the link carries it', () => {
    const r = parseDesignerLink('?f=7.15&k=0.95&g=ground-radials', plainModel, { fMHz: 7.15, k: 0.95 });
    expect(r.groundSystem).toBe('none');
  });

  it('apex is absent from a serialized link for a non-apex model', () => {
    const qs = serializeDesignerLink({ fMHz: 7.15, k: 0.95, apexDeg: 90, groundSystem: 'none' }, plainModel);
    expect(qs).not.toContain('apex=');
  });

  it('g is absent from a serialized link for a non-ground model', () => {
    const qs = serializeDesignerLink(
      { fMHz: 7.15, k: 0.95, apexDeg: 120, groundSystem: 'elevated-radials' },
      plainModel
    );
    expect(qs).not.toContain('g=');
  });

  it('apex is present in a serialized link for an apex model; g for a ground model', () => {
    const apexQs = serializeDesignerLink({ fMHz: 7.15, k: 0.95, apexDeg: 90, groundSystem: 'none' }, apexModel);
    expect(apexQs).toContain('apex=90');

    const groundQs = serializeDesignerLink(
      { fMHz: 7.15, k: 0.95, apexDeg: 120, groundSystem: 'ground-radials' },
      groundModel
    );
    expect(groundQs).toContain('g=ground-radials');
  });

  it('every Tier-1 model round-trips serialize → parse idempotently', () => {
    for (const design of Object.values(ANTENNA_DESIGNS) as AntennaDesign[]) {
      const values = { fMHz: 7.15, k: design.defaultK, apexDeg: 120, groundSystem: design.ground?.default ?? 'none' };
      const qs = serializeDesignerLink(values, design);
      const reparsed = parseDesignerLink(qs, design, { fMHz: 0, k: 0 }); // fallbacks unused: qs carries everything active
      expect(reparsed).toEqual(values);
    }
  });
});

// ---------- Zero-trap guarantee (schema-level, via the shared codec directly) ----------
//
// f/k/apex all keep `min: 0` (see designer-link.ts for why) so none of
// today's Tier-1 params actually exercises the no-minimum path. This proves
// the *pattern* Tier-1 will use the day a param legitimately needs zero (an
// apex droop of 0°... no — a height fraction, a reactance): declare it with
// no `min`, and the shared codec's own zero-trap guarantee (proven in
// shareable-link.test.ts) carries over with no bespoke `> 0` check written
// here, unlike the old blanket guard this migration removes.
describe('zero-trap guarantee for a future no-minimum param', () => {
  interface Ctx {
    flag: boolean;
  }
  const noMinSchema: LinkSchema<{ hf: ReturnType<typeof num> }, Ctx> = {
    version: 1,
    params: { hf: num({ default: 0.5 }) } // no min declared — zero is legal
  };

  it('an explicit 0 round-trips as 0, not the default — the old `> 0` guard would have discarded it', () => {
    const r = codecParse('?hf=0', noMinSchema, { flag: true });
    expect(r.state.hf).toBe(0);
    expect(r.present.hf).toBe(true);
  });

  it('an omitted value still falls back to the declared default (the zero trap proper)', () => {
    const r = codecParse('?', noMinSchema, { flag: true });
    expect(r.state.hf).toBe(0.5);
    expect(r.present.hf).toBe(false);
  });
});

describe('designerLinkSchema shape', () => {
  it('declares f and k with an inclusive min: 0 (the closest available equivalent of the old `> 0` guard)', () => {
    expect(designerLinkSchema.params.f.min).toBe(0);
    expect(designerLinkSchema.params.k.min).toBe(0);
    expect(designerLinkSchema.params.apex.min).toBe(0);
  });

  it("g's enum values match the three GroundSystem values", () => {
    expect(designerLinkSchema.params.g.values).toEqual(['elevated-radials', 'ground-radials', 'none']);
  });
});
