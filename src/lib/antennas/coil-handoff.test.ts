import { describe, it, expect } from 'vitest';
import { DEFAULTS } from '$lib/tools/loading-coil/defaults';
import { parse as parseCoil } from '$lib/tools/loading-coil/codec';
import type { UIState } from '$lib/tools/loading-coil/types';
import {
  parseAntennaContext,
  appendAntennaContext,
  encodeCoil,
  decodeCoil,
  outboundUrl,
  returnLink,
  type AntennaContext
} from './coil-handoff';

const ctx: AntennaContext = { slug: 'quarter-wave-vertical', k: 0.95, groundSystem: 'ground-radials' };
const validCoil: UIState = { ...DEFAULTS };
const blockedCoil: UIState = { ...DEFAULTS, fMHz: 30 }; // radiator already resonant

describe('parseAntennaContext', () => {
  it('reads slug/k/g for a loadable model', () => {
    const c = parseAntennaContext('slug=quarter-wave-vertical&k=0.95&g=ground-radials');
    expect(c).toEqual({
      slug: 'quarter-wave-vertical',
      k: 0.95,
      apexDeg: undefined,
      groundSystem: 'ground-radials'
    });
  });
  it('null without a slug (standalone visit)', () => {
    expect(parseAntennaContext('f=7.15&pos=base')).toBeNull();
  });
  it('null for an unknown or non-loadable slug', () => {
    expect(parseAntennaContext('slug=nope')).toBeNull();
    expect(parseAntennaContext('slug=inverted-v-dipole')).toBeNull();
  });
  it('drops an invalid ground system / k rather than throwing', () => {
    const c = parseAntennaContext('slug=quarter-wave-vertical&k=abc&g=bogus')!;
    expect(c.k).toBeUndefined();
    expect(c.groundSystem).toBeUndefined();
  });
});

describe('coil encoding', () => {
  it('round-trips a valid coil', () => {
    const d = decodeCoil(encodeCoil(validCoil))!;
    expect(d).not.toBeNull();
    expect(d.ui.N).toBeCloseTo(validCoil.N, 2);
    expect(d.ui.fMHz).toBe(validCoil.fMHz);
    expect(d.coil.LuH).toBeGreaterThan(0);
  });
  it('null for absent, garbage-blocked, or non-buildable coil', () => {
    expect(decodeCoil(null)).toBeNull();
    expect(decodeCoil('')).toBeNull();
    expect(decodeCoil(encodeCoil(blockedCoil))).toBeNull();
  });
});

describe('outboundUrl (Designer → Loading Coil)', () => {
  it('first trip: shortened prefill plus antenna context', () => {
    const u = outboundUrl('/b', ctx, { fMHz: 7.15, hM: 1.5 });
    const [path, qs] = u.split('?');
    expect(path).toBe('/b/tools/loading-coil');
    const q = new URLSearchParams(qs);
    expect(q.get('f')).toBe('7.15');
    expect(q.get('pos')).toBe('base');
    expect(q.get('H')).toBe('1.500');
    expect(q.get('slug')).toBe('quarter-wave-vertical');
    expect(q.get('k')).toBe('0.95');
    expect(q.get('g')).toBe('ground-radials');
  });
  it('edit trip: carries the current coil state, not the prefill', () => {
    const coil: UIState = { ...validCoil, mode: 'd', N: 33, H: 2.2 };
    const u = outboundUrl('', ctx, { fMHz: 7.15, hM: 1.5 }, coil);
    const q = new URLSearchParams(u.split('?')[1]);
    const back = parseCoil(q);
    expect(back.H).toBeCloseTo(2.2, 3);
    expect(back.N).toBeCloseTo(33, 2);
    expect(q.get('slug')).toBe('quarter-wave-vertical');
  });
});

describe('returnLink (Loading Coil → Designer)', () => {
  it('null with no antenna context', () => {
    expect(returnLink('', null, validCoil)).toBeNull();
  });
  it('null when the coil is not buildable, even with context', () => {
    expect(returnLink('', ctx, blockedCoil)).toBeNull();
  });
  it('composes path + forwarded params + coil', () => {
    const l = returnLink('/b', { ...ctx, apexDeg: 100 }, validCoil)!;
    const [path, qs] = l.split('?');
    expect(path).toBe('/b/antennas/quarter-wave-vertical');
    const q = new URLSearchParams(qs);
    expect(q.get('f')).toBe(String(validCoil.fMHz));
    expect(q.get('k')).toBe('0.95');
    expect(q.get('apex')).toBe('100');
    expect(q.get('g')).toBe('ground-radials');
    expect(decodeCoil(q.get('coil'))).not.toBeNull();
  });
});

describe('appendAntennaContext', () => {
  it('appends slug/k/g to an existing query; no-op without context', () => {
    const qs = appendAntennaContext('v=1&f=7', ctx);
    expect(new URLSearchParams(qs).get('slug')).toBe('quarter-wave-vertical');
    expect(appendAntennaContext('v=1', null)).toBe('v=1');
  });
});
