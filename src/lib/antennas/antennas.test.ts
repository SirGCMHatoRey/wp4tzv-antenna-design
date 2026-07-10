import { describe, it, expect } from 'vitest';
import { computeAntenna } from './engine';
import { ANTENNA_DESIGNS } from './models';

const at = (slug: string, fMHz: number, k?: number, apexDeg?: number) => {
  const d = ANTENNA_DESIGNS[slug];
  return computeAntenna(d, { fMHz, k: k ?? d.defaultK, apexDeg });
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
