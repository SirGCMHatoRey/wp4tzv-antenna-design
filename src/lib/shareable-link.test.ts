import { describe, it, expect, vi } from 'vitest';
import {
  num,
  enumParam,
  parse,
  serialize,
  writeLinkToAddressBar,
  type LinkSchema,
  type RawParams
} from './shareable-link';

// A representative schema: a param with a floor (positivity opt-in), a param
// with no floor (may be negative/zero), and a conditional enum param whose
// presence depends on an external context (mirrors a Designer's `design`).
interface Ctx {
  ground: boolean;
}

const schema: LinkSchema<
  {
    f: ReturnType<typeof num>;
    x: ReturnType<typeof num>;
    g: ReturnType<typeof enumParam<'none' | 'elevated-radials', Ctx>>;
  },
  Ctx
> = {
  version: 1,
  params: {
    f: num({ default: 7.15, min: 0 }),
    x: num({ default: 5 }), // no min — negative/zero are legal
    g: enumParam(['none', 'elevated-radials'] as const, {
      default: 'none',
      when: (ctx: Ctx) => ctx.ground
    })
  }
};

const withGround: Ctx = { ground: true };
const withoutGround: Ctx = { ground: false };

describe('shareable-link codec', () => {
  it('lets a param with no declared minimum round-trip negative and zero values', () => {
    const negative = parse('?f=7.15&x=-3.2&g=none', schema, withGround);
    expect(negative.state.x).toBe(-3.2);

    const zero = parse('?f=7.15&x=0&g=none', schema, withGround);
    expect(zero.state.x).toBe(0);
    expect(zero.present.x).toBe(true);
  });

  it('is total: garbled, empty, and nonsense input never throws and always resolves', () => {
    expect(() => parse('not a real query string ??==&&', schema, withGround)).not.toThrow();
    expect(() => parse('', schema, withGround)).not.toThrow();
    expect(() => parse('?f=banana&x=%%%&g=nonsense', schema, withGround)).not.toThrow();

    const r = parse('?f=banana&x=%%%&g=nonsense', schema, withGround);
    expect(r.state.f).toBe(schema.params.f.default);
    expect(r.state.x).toBe(schema.params.x.default);
    expect(r.state.g).toBe(schema.params.g.default);
  });

  it('distinguishes an absent param from one explicitly set to its default', () => {
    const absent = parse('?x=1', schema, withGround);
    expect(absent.state.f).toBe(schema.params.f.default);
    expect(absent.present.f).toBe(false);

    const explicit = parse(`?f=${schema.params.f.default}&x=1`, schema, withGround);
    expect(explicit.state.f).toBe(schema.params.f.default);
    expect(explicit.present.f).toBe(true);
  });

  it('the zero trap: a param permitting zero, omitted from the link, resolves to its default, not zero', () => {
    const r = parse('?f=7.15', schema, withGround); // x omitted entirely
    expect(r.state.x).toBe(5); // x's declared default — not 0
    expect(r.present.x).toBe(false);
  });

  it('ignores unknown keys on parse and never emits them on serialize', () => {
    const r = parse('?f=7.15&x=1&g=none&utm_source=chat&bogus=1', schema, withGround);
    expect(r.state.f).toBe(7.15);

    const qs = serialize(r.state, schema, withGround);
    expect(qs).not.toContain('utm_source');
    expect(qs).not.toContain('bogus');
  });

  it('a param whose `when` is false is absent from serialize and is not read on parse', () => {
    // Even though the link explicitly carries g=elevated-radials, it must not
    // be read when the context says this param doesn't apply.
    const r = parse('?f=7.15&x=1&g=elevated-radials', schema, withoutGround);
    expect(r.state.g).toBe(schema.params.g.default);
    expect(r.present.g).toBe(false);

    const qs = serialize(r.state, schema, withoutGround);
    expect(qs).not.toContain('g=');
  });

  it('round-trips idempotently for each conditional configuration', () => {
    for (const ctx of [withGround, withoutGround]) {
      const state = parse('?f=14.2&x=-1.5&g=elevated-radials', schema, ctx).state;
      const first = serialize(state, schema, ctx); // canonical starting point
      const second = serialize(parse(first, schema, ctx).state, schema, ctx);
      expect(second).toBe(first);
    }
  });

  it('treats a param that is present but empty as malformed, resolving to its default', () => {
    const r = parse('?f=7.15&x=&g=none', schema, withGround);
    expect(r.state.x).toBe(5); // declared default, not Number('') === 0
    expect(r.present.x).toBe(true); // the key was present — just malformed
  });

  it('stays total when `ctx` is omitted for a schema with a `when`-guarded param', () => {
    // schema.g depends on ctx.ground; omitting ctx must not throw, and the
    // param must resolve as inactive rather than dereferencing undefined.
    expect(() => parse('?f=7.15&x=1&g=elevated-radials', schema)).not.toThrow();
    const r = parse('?f=7.15&x=1&g=elevated-radials', schema);
    expect(r.state.g).toBe(schema.params.g.default);
    expect(r.present.g).toBe(false);

    expect(() => serialize(r.state, schema)).not.toThrow();
    expect(serialize(r.state, schema)).not.toContain('g=');
  });

  it('gives the migration hook visibility into keys the current schema no longer uses', () => {
    // A rename-shaped migration: the old link uses `freq`, the current
    // schema only knows `f`. The hook must see `freq` in the raw dict (it
    // isn't pre-filtered to the current schema's keys) and can remap it.
    const renameMigrate = vi.fn((raw: RawParams, _from: number) => ({ ...raw, f: raw.freq }));
    const versionedSchema: LinkSchema<typeof schema.params, Ctx> = {
      ...schema,
      version: 2,
      migrate: renameMigrate
    };

    const r = parse('?v=1&freq=21.2&x=1&g=none', versionedSchema, withGround);
    expect(renameMigrate).toHaveBeenCalledWith(expect.objectContaining({ freq: '21.2' }), 1);
    expect(r.state.f).toBe(21.2);
  });

  it('never encodes anything the schema does not declare, even if the state object carries extra properties', () => {
    const state = { f: 7.15, x: 1, g: 'none', computedOutput: 999 } as unknown as ReturnType<
      typeof parse<typeof schema.params, Ctx>
    >['state'];
    const qs = serialize(state, schema, withGround);
    expect(qs).not.toContain('computedOutput');
    expect(qs).not.toContain('999');
  });

  it('resolves an absent version as the schema current version and does not invoke migrate', () => {
    const migrate = vi.fn((raw: RawParams) => raw);
    const versionedSchema: LinkSchema<typeof schema.params, Ctx> = { ...schema, migrate };

    const r = parse('?f=7.15&x=1&g=none', versionedSchema, withGround);
    expect(r.version).toBe(1);
    expect(migrate).not.toHaveBeenCalled();
  });

  it('invokes the migration hook as a pass-through when the link version is older', () => {
    const migrate = vi.fn((raw: RawParams) => raw);
    const versionedSchema: LinkSchema<typeof schema.params, Ctx> = { ...schema, version: 2, migrate };

    const r = parse('?v=1&f=7.15&x=1&g=none', versionedSchema, withGround);
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(migrate).toHaveBeenCalledWith(expect.objectContaining({ f: '7.15' }), 1);
    expect(r.version).toBe(2);
    expect(r.state.f).toBe(7.15); // pass-through: value unaffected
  });

  it('serializes with the schema current version', () => {
    const qs = serialize(parse('?f=7.15&x=1&g=none', schema, withGround).state, schema, withGround);
    expect(qs).toContain('v=1');
  });

  it('writeLinkToAddressBar is a no-op outside a browser and does not throw', () => {
    expect(() => writeLinkToAddressBar('f=7.15')).not.toThrow();
  });
});
