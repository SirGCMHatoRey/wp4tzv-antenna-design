import { describe, it, expect } from 'vitest';
import { nagaokaKL } from '$lib/physics/nagaoka';
import { zc, requiredInductance } from './stub';
import { currentSheetL, solveGeom, selfCapacitance, fSelf } from './coil';
import { computeLoadingCoil } from './engine';
import { parse, serialize, toEngineInputs, SCHEMA_VERSION } from './codec';
import { DEFAULTS } from './defaults';
import {
  toUnitSystem,
  toLengthUnit,
  convertDisplayGeometry,
  convertWireDisplay
} from './units';
import type { EngineInputs } from './types';

const uH = (h: number) => h * 1e6;

// ---------- D. Stage-1 required inductance (stub.ts) ----------
describe('Stage 1 — required inductance', () => {
  it('D1: Zc(H=2.5, a=3.2mm) ≈ 381 Ω', () => {
    expect(zc(2.5, 0.0032)).toBeCloseTo(381, 0);
  });

  it('D2: base-loaded L_req ≈ 20.6 µH (±10%)', () => {
    const r = requiredInductance({
      fHz: 7.15e6, H: 2.5, a: 0.0032, vf: 0.96, pos: 'base',
      mode: 'N', wireDiam: 0.001
    } as EngineInputs);
    expect(r.alreadyResonant).toBe(false);
    expect(uH(r.reqInductanceH)).toBeGreaterThan(20.6 * 0.9);
    expect(uH(r.reqInductanceH)).toBeLessThan(20.6 * 1.1);
  });

  it('D3: center-loaded splits into two equal capacitive stubs', () => {
    const r = requiredInductance({
      fHz: 7.15e6, H: 2.5, a: 0.0032, vf: 0.96, pos: 'center',
      mode: 'N', wireDiam: 0.001
    } as EngineInputs);
    expect(r.xLowerOhm).toBeCloseTo(r.xUpperOhm, 6);
    expect(r.xLowerOhm).toBeLessThan(0); // capacitive
    expect(r.reqInductanceH).toBeGreaterThan(0);
  });

  it('D4: VF changes β·ℓ monotonically (lower VF → longer electrical length → less L)', () => {
    // NB: golden fixture D4 stated "lower VF raises L_req"; the physics is the
    // opposite for a sub-90° stub — lower VF ⇒ larger β ⇒ larger β·ℓ ⇒ smaller
    // cot ⇒ less capacitive reactance to cancel ⇒ smaller L_req. Engine is right.
    const mk = (vf: number) =>
      requiredInductance({ fHz: 7.15e6, H: 2.5, a: 0.0032, vf, pos: 'base', mode: 'N', wireDiam: 0.001 } as EngineInputs)
        .reqInductanceH;
    expect(mk(0.94)).toBeLessThan(mk(0.96));
  });
});

// ---------- B. Current-sheet inductance (coil.ts) ----------
describe('Stage 2 — current-sheet inductance', () => {
  it('B1: L(N=40, D=25mm, ℓ=50mm) ≈ 16.15 µH (exact Lundin k_L=0.818)', () => {
    // Refines the fixture's k_L≈0.80 (→15.8 µH) to the exact Lundin value.
    expect(nagaokaKL(0.025, 0.05)).toBeCloseTo(0.818, 2);
    expect(uH(currentSheetL(40, 0.025, 0.05))).toBeCloseTo(16.15, 1);
  });

  it('B2: pure current-sheet (k_L divided out) ≈ 19.74 µH', () => {
    const pure = currentSheetL(40, 0.025, 0.05) / nagaokaKL(0.025, 0.05);
    expect(uH(pure)).toBeCloseTo(19.74, 1);
  });

  it('B3: Nagaoka beats naive µ₀N²A/ℓ by >5× for a short pancake', () => {
    const ratio = 1 / nagaokaKL(1, 0.05); // naive / current-sheet
    expect(ratio).toBeGreaterThan(5);
  });
});

// ---------- C. Solve-mode round-trip (coil.ts) ----------
describe('Stage 2 — solve-mode invertibility', () => {
  const L = currentSheetL(40, 0.025, 0.075);

  it('C1: solve N recovers 40', () => {
    expect(solveGeom(L, 'N', { d: 0.025, len: 0.075 })).toBeCloseTo(40, 2);
  });
  it('C2: solve ℓ recovers 75 mm', () => {
    expect(solveGeom(L, 'len', { N: 40, d: 0.025 })! * 1000).toBeCloseTo(75, 1);
  });
  it('C3: solve d recovers 25 mm', () => {
    expect(solveGeom(L, 'd', { N: 40, len: 0.075 })! * 1000).toBeCloseTo(25, 1);
  });
  it('C4: L(ℓ) strictly ↓ and L(d) strictly ↑', () => {
    expect(currentSheetL(40, 0.025, 0.05)).toBeGreaterThan(currentSheetL(40, 0.025, 0.1));
    expect(currentSheetL(40, 0.03, 0.075)).toBeGreaterThan(currentSheetL(40, 0.02, 0.075));
  });
});

// ---------- E. Advisory figures (coil.ts) ----------
describe('Advisory Q / self-resonance', () => {
  it('E1: Medhurst self-C(D=25mm, ℓ=50mm) ≈ 1.24 pF', () => {
    expect(selfCapacitance(0.025, 0.05) * 1e12).toBeCloseTo(1.24, 2);
  });
  it('E2: f_self(L=16.15µH, C=1.24pF) ≈ 35.6 MHz (±5%)', () => {
    const f = fSelf(16.15e-6, 1.24e-12) / 1e6;
    expect(f).toBeGreaterThan(35.6 * 0.95);
    expect(f).toBeLessThan(35.6 * 1.05);
  });
});

// ---------- F. Status / validation (engine.ts) ----------
describe('engine status transitions', () => {
  const base = toEngineInputs(DEFAULTS);

  it('F6: default design is ok with no warnings', () => {
    const r = computeLoadingCoil(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings).toHaveLength(0);
      expect(r.values.N).toBeGreaterThan(0);
      expect(r.values.qEst).toBeGreaterThan(50);
      expect(r.values.qEst).toBeLessThan(3000);
    }
  });

  it('F1: radiator already at resonance blocks ALREADY_RESONANT', () => {
    const r = computeLoadingCoil({ ...base, fHz: 30e6, pos: 'base' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blocks[0].code).toBe('ALREADY_RESONANT');
  });

  it('F2: center-loaded 40 m on a 1-inch form blocks WIRE_WONT_FIT', () => {
    const r = computeLoadingCoil({ ...base, pos: 'center', len: 0.05 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blocks[0].code).toBe('WIRE_WONT_FIT');
  });

  it('F3: unreachable target L blocks NO_REAL_SOLUTION', () => {
    const r = computeLoadingCoil({ ...base, mode: 'd', N: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blocks[0].code).toBe('NO_REAL_SOLUTION');
  });
});

// ---------- G. Codec round-trip (codec.ts) ----------
describe('codec', () => {
  it('G1: serialize(parse(x)) === x for each solve mode', () => {
    for (const mode of ['N', 'd', 'len'] as const) {
      const canonical = serialize({ ...DEFAULTS, mode });
      expect(serialize(parse(canonical))).toBe(canonical);
    }
  });

  it('G2: outputs (L, Q, f_self) never appear in serialized params', () => {
    const s = serialize(DEFAULTS);
    expect(s).not.toMatch(/(^|&)(L|Q|fs|fSelf|LuH)=/i);
  });

  it("G1b: only the fixed geometry pair is encoded (solved var absent)", () => {
    expect(serialize({ ...DEFAULTS, mode: 'N' })).not.toMatch(/(^|&)N=/);
    expect(serialize({ ...DEFAULTS, mode: 'd' })).not.toMatch(/(^|&)d=/);
    expect(serialize({ ...DEFAULTS, mode: 'len' })).not.toMatch(/(^|&)len=/);
  });

  it('G5: parse is total — unknown keys ignored, missing → default, never throws', () => {
    expect(() => parse('garbage=1&f=&pos=nonsense&vf=abc')).not.toThrow();
    const s = parse('zzz=9');
    expect(s.fMHz).toBe(DEFAULTS.fMHz);
    expect(s.v).toBe(SCHEMA_VERSION);
  });

  it('G4: a handoff URL parses into a valid pre-filled state', () => {
    const s = parse('f=3.7&pos=base&H=3.0&vf=0.94&mode=N&d=30&len=90&wire=14&u=m');
    expect(s.fMHz).toBe(3.7);
    expect(s.pos).toBe('base');
    expect(s.units).toBe('metric');
    const r = computeLoadingCoil(toEngineInputs(s));
    expect(typeof r.ok).toBe('boolean');
  });
});

// ---------- H. Global units bridge (units.ts) — issue #2 ----------
describe('global units bridge (m/ft ⇄ metric/imperial)', () => {
  it('H1: toUnitSystem maps the global store representation exactly', () => {
    expect(toUnitSystem('m')).toBe('metric');
    expect(toUnitSystem('ft')).toBe('imperial');
  });

  it('H2: toLengthUnit is the exact inverse', () => {
    expect(toLengthUnit('metric')).toBe('m');
    expect(toLengthUnit('imperial')).toBe('ft');
  });

  it('H3: the m/ft ⇄ metric/imperial mapping round-trips both ways', () => {
    for (const u of ['m', 'ft'] as const) expect(toLengthUnit(toUnitSystem(u))).toBe(u);
    for (const u of ['metric', 'imperial'] as const) expect(toUnitSystem(toLengthUnit(u))).toBe(u);
  });

  it('H4: convertDisplayGeometry is a no-op when the system is unchanged', () => {
    const g = { H: 2.5, a: 3.2, d: 25, len: 75 };
    expect(convertDisplayGeometry(g, 'metric', 'metric')).toEqual(g);
  });

  it('H5: convertDisplayGeometry converts, not resets — round-trips within tolerance', () => {
    const g = { H: 2.5, a: 3.2, d: 25, len: 75 }; // metric: m, mm, mm, mm
    const imperial = convertDisplayGeometry(g, 'metric', 'imperial');
    expect(imperial.H).not.toBe(g.H);
    const back = convertDisplayGeometry(imperial, 'imperial', 'metric');
    expect(back.H).toBeCloseTo(g.H, 6);
    expect(back.a).toBeCloseTo(g.a, 6);
    expect(back.d).toBeCloseTo(g.d, 6);
    expect(back.len).toBeCloseTo(g.len, 6);
  });

  it('H6: convertWireDisplay round-trips mm ⇄ AWG', () => {
    const mm = 1.29; // #16 AWG
    const awg = convertWireDisplay(mm, 'metric', 'imperial');
    expect(awg).toBeCloseTo(16, 0);
    const back = convertWireDisplay(awg, 'imperial', 'metric');
    expect(back).toBeCloseTo(mm, 1);
  });
});
