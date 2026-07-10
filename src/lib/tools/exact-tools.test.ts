import { describe, it, expect } from 'vitest';
import { computeWavelength } from './wavelength/engine';
import { computeVelocityFactor } from './velocity-factor/engine';
import { computeResonantFrequency } from './resonant-frequency/engine';
import { computeBalunRatio } from './balun-ratio/engine';
import { computeSwr } from './swr/engine';

describe('Wavelength', () => {
  it('λ = c/f for 7.15 MHz ≈ 41.93 m', () => {
    const r = computeWavelength({ fMHz: 7.15, vf: 1 });
    expect(r.lambdaM).toBeCloseTo(41.93, 1);
    expect(r.halfM).toBeCloseTo(20.96, 1);
  });
  it('applies VF to the physical length', () => {
    const r = computeWavelength({ fMHz: 7.15, vf: 0.66 });
    expect(r.physM).toBeCloseTo(41.93 * 0.66, 1);
    expect(r.quarterM).toBeCloseTo((41.93 * 0.66) / 4, 2);
  });
});

describe('Velocity Factor', () => {
  it('VF = physical / electrical from measured lengths', () => {
    expect(computeVelocityFactor({ mode: 'lengths', physical: 20, electrical: 30 }).vf).toBeCloseTo(0.6667, 3);
  });
  it('passes a material preset through', () => {
    expect(computeVelocityFactor({ mode: 'material', material: 0.85 }).vf).toBe(0.85);
  });
});

describe('Resonant Frequency', () => {
  it('LC: 1 µH + 100 pF ≈ 15.92 MHz', () => {
    expect(computeResonantFrequency({ mode: 'lc', L: 1e-6, C: 100e-12 }).fMHz).toBeCloseTo(15.92, 1);
  });
  it('length: 20 m half-wave with k=0.95 ≈ 7.12 MHz', () => {
    expect(computeResonantFrequency({ mode: 'length', lenM: 20, k: 0.95 }).fMHz).toBeCloseTo(7.12, 1);
  });
});

describe('Balun ratio', () => {
  it('50→200 Ω is 4:1 impedance, 2:1 turns', () => {
    const r = computeBalunRatio({ zIn: 50, zOut: 200 });
    expect(r.impedanceRatio).toBeCloseTo(4, 6);
    expect(r.turnsRatio).toBeCloseTo(2, 6);
    expect(r.label).toBe('4 : 1');
  });
  it('200→50 Ω labels 1:4', () => {
    expect(computeBalunRatio({ zIn: 200, zOut: 50 }).label).toBe('1 : 4');
  });
});

describe('SWR', () => {
  it('matched 50 Ω into 50 Ω → SWR 1, |Γ| 0', () => {
    const r = computeSwr({ mode: 'impedance', z0: 50, r: 50, x: 0 });
    expect(r.swr).toBeCloseTo(1, 6);
    expect(r.gammaMag).toBeCloseTo(0, 6);
    expect(r.returnLossDb).toBe(Infinity);
  });
  it('100+j0 into 50 Ω → SWR 2', () => {
    const r = computeSwr({ mode: 'impedance', z0: 50, r: 100, x: 0 });
    expect(r.gammaMag).toBeCloseTo(1 / 3, 4);
    expect(r.swr).toBeCloseTo(2, 4);
  });
  it('reactive load raises SWR above the resistive-only value', () => {
    const resistive = computeSwr({ mode: 'impedance', z0: 50, r: 50, x: 0 }).swr;
    const reactive = computeSwr({ mode: 'impedance', z0: 50, r: 50, x: 50 }).swr;
    expect(reactive).toBeGreaterThan(resistive);
  });
  it('power: 100 W fwd / 11.1 W rev → SWR ≈ 2', () => {
    const r = computeSwr({ mode: 'power', pFwd: 100, pRev: 11.11 });
    expect(r.swr).toBeCloseTo(2, 1);
  });
  it('open circuit → infinite SWR', () => {
    const r = computeSwr({ mode: 'power', pFwd: 100, pRev: 100 });
    expect(r.swr).toBe(Infinity);
  });
});
