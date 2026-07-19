import { describe, it, expect } from 'vitest';
import { computeAntenna } from './engine';
import { ANTENNA_DESIGNS } from './models';
import type { GroundSystem } from './types';

const at = (slug: string, fMHz: number, k?: number, apexDeg?: number, groundSystem?: GroundSystem) => {
  const d = ANTENNA_DESIGNS[slug];
  return computeAntenna(d, { fMHz, k: k ?? d.defaultK, apexDeg, groundSystem });
};

describe('Tier-1 Designer engine', () => {
  it('half-wave dipole on 40 m ≈ 19.9 m total, 9.96 m legs', () => {
    const r = at('half-wave-dipole', 7.15);
    expect(r.primaryM).toBeCloseTo(0.95 * (299.792458 / 7.15) / 2, 3);
    expect(r.primaryM).toBeCloseTo(19.92, 1);
    expect(r.dims[1].m).toBeCloseTo(r.primaryM / 2, 6);
  });

  it('quarter-wave vertical on 40 m ≈ 9.96 m radiator', () => {
    const r = at('quarter-wave-vertical', 7.15);
    expect(r.dims[0].m).toBeCloseTo(9.96, 1);
    expect(r.dims[1].label).toContain('Radials');
  });

  it('full-wave quad loop on 40 m ≈ 42.8 m perimeter, 10.7 m sides', () => {
    const r = at('full-wave-loop', 7.15);
    expect(r.primaryM).toBeCloseTo(1.02 * (299.792458 / 7.15), 2);
    expect(r.dims[1].m).toBeCloseTo(r.primaryM / 4, 6);
  });

  it('delta loop sides are perimeter / 3', () => {
    const r = at('delta-loop', 14.2);
    expect(r.dims[1].m).toBeCloseTo(r.primaryM / 3, 6);
  });

  it('inverted-V apex droop shortens vs a flat dipole', () => {
    const flat = at('inverted-v-dipole', 7.15, 0.95, 180);
    const drooped = at('inverted-v-dipole', 7.15, 0.95, 90);
    expect(drooped.primaryM).toBeLessThan(flat.primaryM);
    expect(drooped.primaryM).toBeGreaterThan(flat.primaryM * 0.95);
  });

  it('wavelength scales inversely with frequency', () => {
    expect(at('half-wave-dipole', 14.3).primaryM).toBeCloseTo(at('half-wave-dipole', 7.15).primaryM / 2, 4);
  });

  it('every Tier-1 model produces finite positive primary length', () => {
    for (const slug of Object.keys(ANTENNA_DESIGNS)) {
      const r = at(slug, 7.15);
      expect(r.primaryM).toBeGreaterThan(0);
      expect(Number.isFinite(r.lambdaM)).toBe(true);
      expect(r.dims.length).toBeGreaterThan(0);
    }
  });
});

// ---------- Half-Wave Vertical + ground system (issue #4) ----------
describe('Half-Wave Vertical', () => {
  it('is twice the quarter-wave radiator at the same frequency and k', () => {
    const quarter = at('quarter-wave-vertical', 7.15, 0.95);
    const half = at('half-wave-vertical', 7.15, 0.95);
    expect(half.primaryM).toBeCloseTo(quarter.primaryM * 2, 6);
  });

  it('defaults to no ground system — no radial dim, single radiator dim', () => {
    const r = at('half-wave-vertical', 7.15);
    expect(r.dims).toHaveLength(1);
    expect(r.dims[0].key).toBe('rad');
  });
});

describe('Ground System (issue #4)', () => {
  it('"none" omits the radial dimension; both radial options include one', () => {
    const none = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'none');
    const elevated = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'elevated-radials');
    const ground = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'ground-radials');
    expect(none.dims.find((d) => d.key === 'radial')).toBeUndefined();
    expect(elevated.dims.find((d) => d.key === 'radial')).toBeDefined();
    expect(ground.dims.find((d) => d.key === 'radial')).toBeDefined();
  });

  it('radial count and radial length differ between elevated and ground-mounted', () => {
    const elevated = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'elevated-radials');
    const ground = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'ground-radials');
    const eR = elevated.dims.find((d) => d.key === 'radial')!;
    const gR = ground.dims.find((d) => d.key === 'radial')!;
    expect(eR.label).not.toBe(gR.label); // count differs
    expect(eR.m).not.toBeCloseTo(gR.m, 3); // physical length differs
  });

  it('feed summary and Accuracy Note differ across ground systems on the quarter-wave', () => {
    const elevated = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'elevated-radials');
    const ground = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'ground-radials');
    const none = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'none');
    const feeds = new Set([elevated.feed, ground.feed, none.feed]);
    const accuracies = new Set([elevated.accuracy, ground.accuracy, none.accuracy]);
    expect(feeds.size).toBe(3);
    expect(accuracies.size).toBe(3);
  });

  it('ground system never changes the radiator length', () => {
    const elevated = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'elevated-radials');
    const none = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'none');
    expect(elevated.primaryM).toBe(none.primaryM);
  });

  it('omitting groundSystem yields the same result as the model default', () => {
    const omitted = at('quarter-wave-vertical', 7.15, 0.95);
    const explicitDefault = at('quarter-wave-vertical', 7.15, 0.95, undefined, 'elevated-radials');
    expect(omitted).toEqual(explicitDefault);
  });

  it('models without ground capability are inert to groundSystem', () => {
    // Covers all three non-vertical shapes — dipole, loop, wire — not just one.
    for (const slug of ['half-wave-dipole', 'full-wave-loop', 'end-fed-half-wave']) {
      const withGround = at(slug, 7.15, undefined, undefined, 'elevated-radials');
      const withoutGround = at(slug, 7.15);
      expect(withGround).toEqual(withoutGround);
    }
  });
});
