import { describe, it, expect } from 'vitest';
import { parseTier2Link, serializeTier2Link, tier2LinkSchema, type Tier2LinkValues } from './tier2-link';
import { TIER2_DESIGNS } from './tier2';
import { parse as codecParse } from '$lib/shareable-link';

const yagi = TIER2_DESIGNS['yagi-uda']; // hasElements
const moxon = TIER2_DESIGNS['moxon-rectangle']; // plain
const jpole = TIER2_DESIGNS['j-pole-slim-jim']; // hasVariant
const collinear = TIER2_DESIGNS['dual-band-collinear']; // dual

const fb = (d: (typeof TIER2_DESIGNS)[keyof typeof TIER2_DESIGNS]) => ({
  fMHz: d.dual?.defaultF1 ?? 7.15,
  k: d.defaultK
});

// ---------- Golden strings: link shapes published before this codec ----------
// The old Tier2Designer wrote (unversioned): f, k, then `el` only when
// design.hasElements, `var` only when design.hasVariant.
describe('golden-string back-compat: pre-codec Tier-2 links', () => {
  it('Yagi: un-versioned f/k/el link resolves as before', () => {
    const v = parseTier2Link('f=14.2&k=0.97&el=4', yagi, fb(yagi));
    expect(v).toMatchObject({ fMHz: 14.2, k: 0.97, elements: 4 });
  });
  it('J-Pole: un-versioned f/k/var link resolves as before', () => {
    const v = parseTier2Link('f=146&k=0.95&var=slimjim', jpole, fb(jpole));
    expect(v).toMatchObject({ fMHz: 146, k: 0.95, variant: 'slimjim' });
    expect(parseTier2Link('f=146&k=0.95&var=superj', jpole, fb(jpole)).variant).toBe('superj');
  });
  it('Moxon: un-versioned f/k link resolves as before', () => {
    expect(parseTier2Link('f=14.2&k=1', moxon, fb(moxon))).toMatchObject({ fMHz: 14.2, k: 1 });
  });
  it('the old writer shape is what serialize now emits, plus a version tag', () => {
    const v = parseTier2Link('f=14.2&k=0.97&el=4', yagi, fb(yagi));
    expect(serializeTier2Link(v, yagi)).toBe('v=1&f=14.2&k=0.97&el=4');
  });
});

describe('absent vs default (the zero trap)', () => {
  it('absent params resolve to fallbacks, never 0', () => {
    const v = parseTier2Link('', yagi, { fMHz: 14.2, k: 0.97 });
    expect(v.fMHz).toBe(14.2);
    expect(v.k).toBe(0.97);
    expect(v.elements).toBe(3);
  });
  it('zero / negative / garbage f, k fall back', () => {
    for (const bad of ['0', '-3', 'abc', '']) {
      const v = parseTier2Link(`f=${bad}&k=${bad}`, moxon, fb(moxon));
      expect(v.fMHz).toBe(fb(moxon).fMHz);
      expect(v.k).toBe(fb(moxon).k);
    }
  });
  it('bad enum variant falls back to jpole', () => {
    expect(parseTier2Link('var=nope', jpole, fb(jpole)).variant).toBe('jpole');
  });
});

describe('conditional params', () => {
  it('el is neither read nor written for a model without elements', () => {
    expect(parseTier2Link('f=14.2&el=6', moxon, fb(moxon)).elements).toBe(3);
    expect(serializeTier2Link(parseTier2Link('el=6', moxon, fb(moxon)), moxon)).not.toMatch(/el=/);
  });
  it('var only for hasVariant; f2/vf only for dual', () => {
    expect(serializeTier2Link(parseTier2Link('', yagi, fb(yagi)), yagi)).not.toMatch(/var=|f2=|vf=/);
    const j = serializeTier2Link(parseTier2Link('', jpole, fb(jpole)), jpole);
    expect(j).toMatch(/var=jpole/);
    expect(j).not.toMatch(/f2=|vf=/);
    const c = serializeTier2Link(parseTier2Link('', collinear, fb(collinear)), collinear);
    expect(c).toMatch(/f2=448.5/);
    expect(c).toMatch(/vf=0.66/);
  });
});

describe('dual-band link', () => {
  it('reads f, f2, k, vf', () => {
    const v = parseTier2Link('f=146&f2=465&k=0.95&vf=0.8', collinear, fb(collinear));
    expect(v).toMatchObject({ fMHz: 146, f2MHz: 465, k: 0.95, vf: 0.8 });
  });
  it('round-trips', () => {
    const qs = 'v=1&f=146&k=0.95&f2=465&vf=0.8';
    expect(serializeTier2Link(parseTier2Link(qs, collinear, fb(collinear)), collinear)).toBe(qs);
  });
});

describe('totality, unknown keys, version', () => {
  it('ignores unknown keys and does not re-emit them', () => {
    const v = parseTier2Link('f=14.2&utm_source=x', yagi, fb(yagi));
    expect(serializeTier2Link(v, yagi)).not.toMatch(/utm/);
  });
  it('never throws on nonsense', () => {
    expect(() => parseTier2Link('f=%%%&k=&el=NaN&var=&v=zzz', jpole, fb(jpole))).not.toThrow();
  });
  it('serialized links carry a version; absent version resolves as current', () => {
    const v: Tier2LinkValues = parseTier2Link('', moxon, fb(moxon));
    expect(serializeTier2Link(v, moxon)).toMatch(/^v=1&/);
    expect(codecParse('f=1', tier2LinkSchema, moxon).version).toBe(tier2LinkSchema.version);
  });
  it('idempotent round trip', () => {
    const once = serializeTier2Link(parseTier2Link('f=14.2&k=0.97&el=5', yagi, fb(yagi)), yagi);
    expect(serializeTier2Link(parseTier2Link(once, yagi, fb(yagi)), yagi)).toBe(once);
  });
});
