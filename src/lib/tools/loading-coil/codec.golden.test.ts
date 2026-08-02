// Golden-string back-compat tests (issue #13): pin the Loading Coil's
// currently-published link shape, and the Designer's shorten-and-load handoff
// URL, as literal strings — captured from the pre-migration hand-rolled codec
// (src/lib/tools/loading-coil/codec.ts as it stood before the shared-codec
// migration) — and assert they still resolve to the same state after the
// migration onto src/lib/shareable-link.ts. Written first, per the ticket,
// before touching the implementation.
import { describe, it, expect } from 'vitest';
import { parse, serialize, hasExplicitUnits, toEngineInputs } from './codec';
import { computeLoadingCoil } from './engine';

describe('golden: currently-published Loading Coil link shapes', () => {
  it('a metric link, mode=d (N and len fixed, d solved/absent), resolves unchanged', () => {
    // Captured via serialize() on the pre-migration codec for a non-default
    // design: 20 m, center-loaded, solving for form diameter.
    const qs = 'v=1&f=14.15&pos=center&H=3.5&a=4&vf=0.94&mode=d&N=30&len=60&wire=1.29&u=m';
    const s = parse(qs);
    expect(s.fMHz).toBe(14.15);
    expect(s.pos).toBe('center');
    expect(s.H).toBeCloseTo(3.5, 9);
    expect(s.a).toBeCloseTo(0.004, 9);
    expect(s.vf).toBeCloseTo(0.94, 9);
    expect(s.mode).toBe('d');
    expect(s.N).toBe(30);
    expect(s.len).toBeCloseTo(0.06, 9);
    expect(s.wireDiam).toBeCloseTo(0.00129, 9);
    expect(s.units).toBe('metric');
    // d is the solved variable for this mode — never read from the link, so it
    // resolves to the codec's default rather than anything encoded.
    expect(s.d).toBeCloseTo(0.025, 9);
  });

  it('an imperial link, mode=N (d and len fixed, N solved/absent), resolves unchanged', () => {
    // Captured via serialize() on the pre-migration codec for a 40 m whip in
    // imperial display units (radiator in feet, coil dims in inches, wire AWG).
    const qs =
      'v=1&f=7.15&pos=base&H=8.2021&a=0.126&vf=0.96&mode=N&d=0.9843&len=2.9528&wire=16&u=ft';
    const s = parse(qs);
    expect(s.fMHz).toBe(7.15);
    expect(s.pos).toBe('base');
    expect(s.H).toBeCloseTo(2.5, 4); // 8.2021 ft ≈ 2.5 m
    expect(s.a).toBeCloseTo(0.0032, 4); // 0.126 in ≈ 3.2 mm
    expect(s.vf).toBeCloseTo(0.96, 9);
    expect(s.mode).toBe('N');
    expect(s.d).toBeCloseTo(0.025, 4); // 0.9843 in ≈ 25 mm
    expect(s.len).toBeCloseTo(0.075, 4); // 2.9528 in ≈ 75 mm
    expect(s.wireDiam).toBeCloseTo(0.001291, 5); // #16 AWG
    expect(s.units).toBe('imperial');
    // N is the solved variable for this mode.
    expect(s.N).toBe(40); // codec default — never read from the link
  });

  it('a custom-height-fraction link (Height slider, not base/center) resolves unchanged', () => {
    const qs = 'v=1&f=3.7&pos=0.42&H=10&a=5&vf=0.95&mode=len&N=60&d=50&wire=1&u=m';
    const s = parse(qs);
    expect(s.pos).toBe(0.42);
    expect(s.H).toBeCloseTo(10, 9);
    expect(s.a).toBeCloseTo(0.005, 9);
    expect(s.mode).toBe('len');
    expect(s.N).toBe(60);
    expect(s.d).toBeCloseTo(0.05, 9);
    expect(s.wireDiam).toBeCloseTo(0.001, 9);
    // len is the solved variable for this mode.
    expect(s.len).toBeCloseTo(0.075, 9); // codec default
  });

  it('outputs are never present in any of these published link shapes', () => {
    for (const qs of [
      'v=1&f=14.15&pos=center&H=3.5&a=4&vf=0.94&mode=d&N=30&len=60&wire=1.29&u=m',
      'v=1&f=7.15&pos=base&H=8.2021&a=0.126&vf=0.96&mode=N&d=0.9843&len=2.9528&wire=16&u=ft',
      'v=1&f=3.7&pos=0.42&H=10&a=5&vf=0.95&mode=len&N=60&d=50&wire=1&u=m'
    ]) {
      expect(qs).not.toMatch(/(^|&)(L|Q|fs|fSelf|LuH|zc)=/i);
    }
  });
});

describe('golden: Designer shorten-and-load handoff URL', () => {
  // Constructed exactly as src/lib/antennas/Designer.svelte's `handoffUrl` does:
  // `${base}/tools/loading-coil?f=${Number(fMHz)}&pos=base&H=${handoffH.toFixed(3)}&u=m`
  // — only f, pos, H, u are ever set by the handoff; everything else must come
  // from codec defaults.
  const handoffQs = 'f=7.15&pos=base&H=1.500&u=m';

  it('resolves into a valid, pre-filled Loading Coil state', () => {
    const s = parse(handoffQs);
    expect(s.fMHz).toBe(7.15);
    expect(s.pos).toBe('base');
    expect(s.H).toBeCloseTo(1.5, 9);
    expect(s.units).toBe('metric');
    // Everything the handoff doesn't set falls back to codec defaults.
    expect(s.mode).toBe('N');
    expect(s.vf).toBeCloseTo(0.96, 9);

    const r = computeLoadingCoil(toEngineInputs(s));
    expect(typeof r.ok).toBe('boolean');
    // A deliberately-shortened (60% of resonant) radiator must require loading,
    // not report ALREADY_RESONANT — that's the entire point of "shorten & load".
    if (!r.ok) expect(r.blocks[0].code).not.toBe('ALREADY_RESONANT');
  });

  it('carries units explicitly (u=m), so a recipient adopts metric onto the global switch', () => {
    expect(hasExplicitUnits(handoffQs)).toBe(true);
  });
});

describe('golden: absent-vs-explicit units distinction (issue #2 regression)', () => {
  it('a bare link with no u= param reports units as not explicit', () => {
    expect(hasExplicitUnits('f=7.15&pos=base&H=2.5')).toBe(false);
  });

  it('a link that explicitly carries u=ft (or u=m) reports units as explicit', () => {
    expect(hasExplicitUnits('f=7.15&u=ft')).toBe(true);
    expect(hasExplicitUnits('f=7.15&u=m')).toBe(true);
  });

  it('a Saved Project qs (never wrote u= historically would still be well-formed) is absent-safe', () => {
    expect(hasExplicitUnits('')).toBe(false);
  });
});

describe('golden: round-trip idempotence for every solve mode', () => {
  it('serialize(parse(x)) === x for a canonical link in each mode', () => {
    for (const mode of ['N', 'd', 'len'] as const) {
      const s = parse(`f=7.15&pos=base&H=2.5&a=3.2&vf=0.96&mode=${mode}&N=40&d=25&len=75&wire=16&u=m`);
      const canonical = serialize(s);
      const again = serialize(parse(canonical));
      expect(again).toBe(canonical);
    }
  });
});
