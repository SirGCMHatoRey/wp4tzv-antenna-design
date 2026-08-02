import { describe, it, expect } from 'vitest';
import { computeYagi, computeMoxon, computeJPole, TIER2_DESIGNS } from './tier2';

describe('Yagi-Uda', () => {
  it('3-element: reflector > driven > director, correct count', () => {
    const r = computeYagi({ fMHz: 14.2, k: 0.97, elements: 3 });
    const [refl, de, d1] = r.dims;
    expect(refl.m).toBeGreaterThan(de.m);
    expect(de.m).toBeGreaterThan(d1.m);
    expect(r.dims).toHaveLength(3); // reflector + driven + 1 director
    expect(r.shape).toBe('yagi');
  });
  it('more elements → more directors, higher gain estimate, longer boom', () => {
    const g3 = computeYagi({ fMHz: 14.2, k: 0.97, elements: 3 });
    const g6 = computeYagi({ fMHz: 14.2, k: 0.97, elements: 6 });
    expect(g6.dims.length).toBe(6);
    const gain = (r: ReturnType<typeof computeYagi>) =>
      parseFloat(r.extras.find((e) => e.label.startsWith('Gain'))!.value.replace(/[^\d.]/g, ''));
    expect(gain(g6)).toBeGreaterThan(gain(g3));
  });
  it('clamps element count to 3–6', () => {
    expect(computeYagi({ fMHz: 14.2, k: 0.97, elements: 99 }).dims.length).toBe(6);
    expect(computeYagi({ fMHz: 14.2, k: 0.97, elements: 1 }).dims.length).toBe(3);
  });
});

describe('Moxon Rectangle', () => {
  it('width A ≈ 0.375 λ·k and depth = B+C+D', () => {
    const r = computeMoxon({ fMHz: 14.2, k: 1 });
    const lambda = 299.792458 / 14.2;
    const A = r.dims.find((d) => d.key === 'A')!.m;
    const depth = r.dims.find((d) => d.key === 'depth')!.m;
    const B = r.dims.find((d) => d.key === 'B')!.m;
    const C = r.dims.find((d) => d.key === 'C')!.m;
    const D = r.dims.find((d) => d.key === 'D')!.m;
    expect(A).toBeCloseTo(0.375 * lambda, 3);
    expect(depth).toBeCloseTo(B + C + D, 6);
  });
});

describe('J-Pole / Slim Jim', () => {
  it('radiator is a half-wave, stub a quarter-wave (× VF)', () => {
    const r = computeJPole({ fMHz: 146, k: 0.95 });
    const lambda = 299.792458 / 146;
    expect(r.dims.find((d) => d.key === 'rad')!.m).toBeCloseTo(0.5 * lambda * 0.95, 3);
    expect(r.dims.find((d) => d.key === 'stub')!.m).toBeCloseTo(0.25 * lambda * 0.95, 3);
  });
  it('variant switches the labelled design', () => {
    const j = computeJPole({ fMHz: 146, k: 0.95, variant: 'jpole' });
    const s = computeJPole({ fMHz: 146, k: 0.95, variant: 'slimjim' });
    const v = (r: ReturnType<typeof computeJPole>) => r.extras.find((e) => e.label === 'Variant')!.value;
    expect(v(j)).not.toBe(v(s));
  });

  describe('Super J variant', () => {
    const lambda = 299.792458 / 146;
    const vf = 0.95;

    it('has two half-wave radiators and a quarter-wave phasing stub, each × VF', () => {
      const r = computeJPole({ fMHz: 146, k: vf, variant: 'superj' });
      expect(r.dims.find((d) => d.key === 'rad')!.m).toBeCloseTo(0.5 * lambda * vf, 3);
      expect(r.dims.find((d) => d.key === 'rad2')!.m).toBeCloseTo(0.5 * lambda * vf, 3);
      expect(r.dims.find((d) => d.key === 'phase')!.m).toBeCloseTo(0.25 * lambda * vf, 3);
    });

    it('overall height is the sum of all four sections (≈1.5λ × VF)', () => {
      const r = computeJPole({ fMHz: 146, k: vf, variant: 'superj' });
      const stub = r.dims.find((d) => d.key === 'stub')!.m;
      const rad = r.dims.find((d) => d.key === 'rad')!.m;
      const phase = r.dims.find((d) => d.key === 'phase')!.m;
      const rad2 = r.dims.find((d) => d.key === 'rad2')!.m;
      const H = r.dims.find((d) => d.key === 'H')!.m;
      expect(H).toBeCloseTo(stub + rad + phase + rad2, 6);
      expect(H).toBeCloseTo(1.5 * lambda * vf, 3);
    });

    it('scales every section proportionally with VF', () => {
      const r1 = computeJPole({ fMHz: 146, k: 0.8, variant: 'superj' });
      const r2 = computeJPole({ fMHz: 146, k: 0.95, variant: 'superj' });
      const ratio = 0.95 / 0.8;
      for (const key of ['rad', 'rad2', 'phase', 'stub', 'H']) {
        const m1 = r1.dims.find((d) => d.key === key)!.m;
        const m2 = r2.dims.find((d) => d.key === key)!.m;
        expect(m2 / m1).toBeCloseTo(ratio, 5);
      }
    });

    it('advisory gain is greater than the plain J-Pole', () => {
      const j = computeJPole({ fMHz: 146, k: vf, variant: 'jpole' });
      const s = computeJPole({ fMHz: 146, k: vf, variant: 'superj' });
      const gain = (r: ReturnType<typeof computeJPole>) =>
        parseFloat(r.extras.find((e) => e.label.startsWith('Gain'))!.value.match(/[\d.]+/)![0]);
      expect(gain(s)).toBeGreaterThan(gain(j));
    });

    it('has a variant label distinct from J-Pole and Slim Jim', () => {
      const j = computeJPole({ fMHz: 146, k: vf, variant: 'jpole' });
      const sj = computeJPole({ fMHz: 146, k: vf, variant: 'slimjim' });
      const su = computeJPole({ fMHz: 146, k: vf, variant: 'superj' });
      const v = (r: ReturnType<typeof computeJPole>) => r.extras.find((e) => e.label === 'Variant')!.value;
      expect(v(su)).not.toBe(v(j));
      expect(v(su)).not.toBe(v(sj));
    });
  });
});

describe('Tier-2 registry', () => {
  it('every design computes finite dimensions', () => {
    for (const d of Object.values(TIER2_DESIGNS)) {
      const r = d.compute({ fMHz: 14.2, k: d.defaultK, elements: 3, variant: 'jpole' });
      expect(r.dims.length).toBeGreaterThan(0);
      for (const dim of r.dims) expect(Number.isFinite(dim.m)).toBe(true);
    }
  });
  it('the Super J branch also computes finite dimensions', () => {
    const r = TIER2_DESIGNS['j-pole-slim-jim'].compute({ fMHz: 14.2, k: 0.95, variant: 'superj' });
    expect(r.dims.length).toBeGreaterThan(0);
    for (const dim of r.dims) expect(Number.isFinite(dim.m)).toBe(true);
  });
});
