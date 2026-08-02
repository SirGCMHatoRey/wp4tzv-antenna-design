import { describe, it, expect } from 'vitest';
import { lengthDisp, FT_PER_M } from './format';

describe('lengthDisp', () => {
  it('renders a value well below 1 ft as inches in imperial mode', () => {
    // Folded Dipole conductor spacing: 0.02 m ≈ 0.787 in
    const r = lengthDisp(0.02, true, 3);
    expect(r.unit).toBe('in');
    expect(r.value).toBe('0.787');
  });

  it('renders a value well above 1 ft as feet in imperial mode', () => {
    const r = lengthDisp(10, true, 3);
    expect(r.unit).toBe('ft');
  });

  it('renders exactly 1 ft as feet (boundary inclusive on the feet side)', () => {
    const oneFootInMetres = 1 / FT_PER_M;
    const r = lengthDisp(oneFootInMetres, true, 3);
    expect(r.unit).toBe('ft');
    expect(r.value).toBe('1.000');
  });

  it('classifies a genuinely sub-foot value as inches even under a coarse dp', () => {
    // 0.6 ft is well under 1 ft; a dp=0 rounding-based threshold would
    // round it to "1" and wrongly report feet.
    const r = lengthDisp(0.6 / FT_PER_M, true, 0);
    expect(r.unit).toBe('in');
  });

  it('leaves metric mode untouched at any magnitude', () => {
    const small = lengthDisp(0.02, false, 3);
    expect(small.unit).toBe('m');
    const large = lengthDisp(10, false, 3);
    expect(large.unit).toBe('m');
  });
});
