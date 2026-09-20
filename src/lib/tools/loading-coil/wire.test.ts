import { describe, it, expect } from 'vitest';
import { awgToMm, mmToAwg, wireAnnotation, radiusAnnotation } from './wire';

describe('AWG ⇄ mm', () => {
  it('matches reference gauges', () => {
    expect(awgToMm(12)).toBeCloseTo(2.053, 2);
    expect(awgToMm(18)).toBeCloseTo(1.024, 2);
    expect(awgToMm(36)).toBeCloseTo(0.127, 5);
  });
  it('round-trips', () => {
    for (const n of [10, 12, 14, 18, 22, 26]) expect(mmToAwg(awgToMm(n))).toBeCloseTo(n, 9);
  });
});

describe('wireAnnotation (Stage 2 Wire, shows the other representation)', () => {
  it('metric primary (mm) → AWG', () => {
    expect(wireAnnotation(2.053, 'metric')).toBe('≈ AWG 12');
  });
  it('imperial primary (AWG) → mm', () => {
    expect(wireAnnotation(12, 'imperial')).toBe('≈ 2.05 mm');
  });
  it('rounds non-standard diameters to nearest gauge', () => {
    expect(wireAnnotation(1.5, 'metric')).toBe('≈ AWG 15');
  });
  it('blank for invalid input', () => {
    expect(wireAnnotation(0, 'metric')).toBe('');
    expect(wireAnnotation(NaN, 'imperial')).toBe('');
  });
});

describe('radiusAnnotation (Stage 1 radius → diameter-derived AWG)', () => {
  it('doubles radius to diameter, metric mm', () => {
    expect(radiusAnnotation(1.026, 'metric')).toBe('⌀ 2.05 mm ≈ AWG 12');
  });
  it('imperial inches', () => {
    expect(radiusAnnotation(0.0404, 'imperial')).toBe('⌀ 2.05 mm ≈ AWG 12');
  });
  it('blank for invalid', () => {
    expect(radiusAnnotation(-1, 'metric')).toBe('');
  });
});
