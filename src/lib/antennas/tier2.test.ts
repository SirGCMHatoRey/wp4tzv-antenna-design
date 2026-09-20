import { describe, it, expect } from 'vitest';
import { computeYagi, computeMoxon, computeJPole, computeDualBandCollinear, TIER2_DESIGNS } from './tier2';

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

describe('Dual-Band Collinear', () => {
  const C = 299.792458;
  const base = { fMHz: 145, f2MHz: 448.5, k: 0.96, vf: 0.66 };
  const dim = (r: ReturnType<typeof computeDualBandCollinear>, key: string) =>
    r.dims.find((d) => d.key === key)!.m;

  it('VHF/UHF radiators are half-wave × k; phasing coil is half-wave at f2 × VF', () => {
    const r = computeDualBandCollinear(base);
    expect(dim(r, 'vhf')).toBeCloseTo(0.5 * (C / 145) * 0.96, 6);
    expect(dim(r, 'uhf')).toBeCloseTo(0.5 * (C / 448.5) * 0.96, 6);
    expect(dim(r, 'coil')).toBeCloseTo(0.5 * (C / 448.5) * 0.66, 6);
    expect(r.shape).toBe('collinear');
    expect(r.lambdaM).toBeCloseTo(C / 145, 6);
    expect(r.lambdaM2).toBeCloseTo(C / 448.5, 6);
  });
  it('coil length is distinct from both radiators', () => {
    const r = computeDualBandCollinear(base);
    expect(dim(r, 'coil')).not.toBeCloseTo(dim(r, 'vhf'), 3);
    expect(dim(r, 'coil')).not.toBeCloseTo(dim(r, 'uhf'), 3);
  });
  it('changing f1 alone leaves UHF radiator and coil unchanged', () => {
    const a = computeDualBandCollinear(base);
    const b = computeDualBandCollinear({ ...base, fMHz: 146 });
    expect(dim(b, 'uhf')).toBe(dim(a, 'uhf'));
    expect(dim(b, 'coil')).toBe(dim(a, 'coil'));
    expect(dim(b, 'vhf')).not.toBe(dim(a, 'vhf'));
  });
  it('changing f2 alone leaves VHF radiator unchanged', () => {
    const a = computeDualBandCollinear(base);
    const b = computeDualBandCollinear({ ...base, f2MHz: 465 });
    expect(dim(b, 'vhf')).toBe(dim(a, 'vhf'));
    expect(dim(b, 'uhf')).not.toBe(dim(a, 'uhf'));
  });
  it('k scales both radiators but not the coil', () => {
    const a = computeDualBandCollinear(base);
    const b = computeDualBandCollinear({ ...base, k: 0.48 });
    expect(dim(b, 'vhf')).toBeCloseTo(dim(a, 'vhf') / 2, 9);
    expect(dim(b, 'uhf')).toBeCloseTo(dim(a, 'uhf') / 2, 9);
    expect(dim(b, 'coil')).toBe(dim(a, 'coil'));
  });
  it('VF scales only the coil', () => {
    const a = computeDualBandCollinear(base);
    const b = computeDualBandCollinear({ ...base, vf: 0.33 });
    expect(dim(b, 'coil')).toBeCloseTo(dim(a, 'coil') / 2, 9);
    expect(dim(b, 'vhf')).toBe(dim(a, 'vhf'));
    expect(dim(b, 'uhf')).toBe(dim(a, 'uhf'));
  });
  it('overall height is the sum of the three components', () => {
    const r = computeDualBandCollinear(base);
    expect(dim(r, 'H')).toBeCloseTo(dim(r, 'vhf') + dim(r, 'coil') + dim(r, 'uhf'), 9);
  });
  it('reports gain estimate, no-radials note and feed guidance', () => {
    const r = computeDualBandCollinear(base);
    expect(r.extras.some((e) => e.label.startsWith('Gain'))).toBe(true);
    expect(r.notes.join(' ')).toMatch(/no radials/i);
    expect(r.feed.length).toBeGreaterThan(0);
  });
  it('is registered as a Tier-2 design', () => {
    const d = TIER2_DESIGNS['dual-band-collinear'];
    expect(d.name).toBe('Dual-Band Collinear (2m / 70cm+GMRS)');
    expect(d.accuracy).toMatch(/430.467/);
    expect(d.accuracy).toMatch(/NEC/);
  });
});
