import { describe, it, expect } from 'vitest';
import { nagaokaKL } from './nagaoka';

// Golden dataset section A — Nagaoka k_L via Lundin 1985.
describe('nagaokaKL (Lundin)', () => {
  it('A3: k_L(ℓ/D = 1) ≈ 0.6884 (classic anchor)', () => {
    expect(nagaokaKL(1, 1)).toBeCloseTo(0.6884, 3);
  });

  it('A4: k_L → 1 as ℓ/D → ∞ (long-solenoid limit)', () => {
    expect(nagaokaKL(1, 1000)).toBeGreaterThan(0.998);
    expect(nagaokaKL(1, 1000)).toBeLessThanOrEqual(1.0);
  });

  it('A5: short branch matches (2/π)(ℓ/D)[ln(4D/ℓ)−0.5] asymptote within 1%', () => {
    const D = 1;
    const l = 0.05;
    const asymptote = (2 / Math.PI) * (l / D) * (Math.log((4 * D) / l) - 0.5);
    expect(nagaokaKL(D, l)).toBeCloseTo(asymptote, 2);
    expect(Math.abs(nagaokaKL(D, l) - asymptote) / asymptote).toBeLessThan(0.01);
  });

  it('A6: branch continuity across ℓ = D', () => {
    const below = nagaokaKL(1, 0.999999); // short branch
    const above = nagaokaKL(1, 1.000001); // long branch
    expect(Math.abs(above - below)).toBeLessThan(3e-4);
  });

  it('A1: finite, in (0,1], and monotone increasing in ℓ/D', () => {
    let prev = 0;
    for (let ld = 0.05; ld <= 50; ld *= 1.2) {
      const k = nagaokaKL(1, ld);
      expect(k).toBeGreaterThan(0);
      expect(k).toBeLessThanOrEqual(1.0001);
      expect(k).toBeGreaterThan(prev); // increasing with ℓ/D
      prev = k;
    }
  });

  it('rejects non-positive geometry', () => {
    expect(() => nagaokaKL(0, 1)).toThrow();
    expect(() => nagaokaKL(1, -1)).toThrow();
  });
});
