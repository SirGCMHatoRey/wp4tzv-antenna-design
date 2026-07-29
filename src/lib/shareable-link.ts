// Shareable Link codec (ADR-0004, ADR-0008 decision 4): the single, shared
// mechanism every Designer and Engineering Tool reads and writes its links
// through. A surface declares its inputs as a schema (key, type, per-param
// constraint, default, optional `when` condition); this module owns parsing,
// defaulting, versioning, migration, and totality.
//
// parse is total: it never throws. Unknown keys are ignored. Missing or
// malformed values fall back to the param's declared default. Only
// schema-declared params are ever read or written — outputs are never
// encoded because a schema never declares them.

/** A param whose condition governs whether it's read/written at all — e.g. an
 *  apex angle that only exists on the inverted-V, a ground system that only
 *  exists on verticals. `ctx` is the caller's own state (an AntennaDesign,
 *  a solve mode, …), not the parsed link state. */
type When<Ctx> = (ctx: Ctx) => boolean;

export interface NumParam<Ctx = unknown> {
  readonly type: 'num';
  readonly default: number;
  /** Per-param, never global — the absence of a minimum means negative and
   *  zero values are legal (e.g. a reactance, a reflected power). */
  readonly min?: number;
  readonly when?: When<Ctx>;
}

export interface EnumParam<V extends string = string, Ctx = unknown> {
  readonly type: 'enum';
  readonly values: readonly V[];
  readonly default: V;
  readonly when?: When<Ctx>;
}

export type ParamDef<Ctx = unknown> = NumParam<Ctx> | EnumParam<string, Ctx>;
export type ParamMap<Ctx = unknown> = Record<string, ParamDef<Ctx>>;

/** `num` is a reserved-adjacent name for a numeric param; `enum` itself is a
 *  reserved TypeScript keyword, so the enum-param helper is `enumParam`. */
export function num<Ctx = unknown>(opts: { default: number; min?: number; when?: When<Ctx> }): NumParam<Ctx> {
  return { type: 'num', default: opts.default, min: opts.min, when: opts.when };
}

export function enumParam<V extends string, Ctx = unknown>(
  values: readonly V[],
  opts: { default: V; when?: When<Ctx> }
): EnumParam<V, Ctx> {
  return { type: 'enum', values, default: opts.default, when: opts.when };
}

export type RawParams = Record<string, string | undefined>;

/** Raw-param migration: runs only when a link's version is older than the
 *  schema's current version. Built and tested as a pass-through here — no
 *  schema bumps its version yet; the hook exists for future changes, not to
 *  reinterpret links already published. */
export type Migrate = (raw: RawParams, fromVersion: number) => RawParams;

export interface LinkSchema<P extends ParamMap<Ctx>, Ctx = unknown> {
  readonly version: number;
  readonly params: P;
  readonly migrate?: Migrate;
}

export type StateOf<P extends ParamMap<any>> = {
  [K in keyof P]: P[K] extends EnumParam<infer V, any> ? V : number;
};

export type PresenceOf<P extends ParamMap<any>> = {
  [K in keyof P]: boolean;
};

export interface ParseResult<P extends ParamMap<any>> {
  state: StateOf<P>;
  /** Per param, whether the link actually carried it — distinguishes "absent,
   *  fell back to default" from "explicitly set, happens to equal default".
   *  A param inactive under its `when` condition is always reported absent. */
  present: PresenceOf<P>;
  version: number;
}

/** All non-version keys the link actually carries, keyed by their raw name —
 *  deliberately not filtered to the current schema's keys, so a future
 *  `migrate` can see (and rename) a key the current schema no longer uses. */
function toRawParams(q: URLSearchParams): RawParams {
  const raw: RawParams = {};
  for (const [key, value] of q.entries()) {
    if (key === 'v') continue;
    raw[key] = value;
  }
  return raw;
}

/** Whether a param applies at all under the caller's context. A `when` that
 *  can't run because no context was supplied resolves to inactive rather
 *  than throwing — parse/serialize stay total even if a caller forgets ctx. */
function isActive<Ctx>(def: ParamDef<Ctx>, ctx: Ctx | undefined): boolean {
  if (!def.when) return true;
  if (ctx === undefined) return false;
  return def.when(ctx);
}

function resolveParam(def: ParamDef<any>, raw: string | undefined): number | string {
  if (raw === undefined || raw === '') return def.default;
  if (def.type === 'num') {
    const n = Number(raw);
    if (!Number.isFinite(n)) return def.default;
    if (def.min !== undefined && n < def.min) return def.default;
    return n;
  }
  return def.values.includes(raw) ? raw : def.default;
}

/** Total parse: never throws. Unknown keys ignored; missing/malformed values
 *  fall back to declared defaults; a param inactive under `when` is neither
 *  read nor reported present. An absent `v` resolves as the schema's current
 *  version — the migration hook runs only for an explicitly older version. */
export function parse<P extends ParamMap<Ctx>, Ctx = unknown>(
  query: string | URLSearchParams,
  schema: LinkSchema<P, Ctx>,
  ctx?: Ctx
): ParseResult<P> {
  const q = typeof query === 'string' ? new URLSearchParams(query) : query;
  const keys = Object.keys(schema.params);

  const vRaw = q.get('v');
  const vParsed = vRaw === null ? schema.version : Number(vRaw);
  const fromVersion = Number.isFinite(vParsed) ? vParsed : schema.version;

  let raw = toRawParams(q);
  if (fromVersion < schema.version && schema.migrate) {
    raw = schema.migrate(raw, fromVersion);
  }

  const state = {} as Record<string, unknown>;
  const present = {} as Record<string, boolean>;

  for (const key of keys) {
    const def = schema.params[key];
    if (!isActive(def, ctx)) {
      state[key] = def.default;
      present[key] = false;
      continue;
    }
    present[key] = raw[key] !== undefined;
    state[key] = resolveParam(def, raw[key]);
  }

  return { state: state as StateOf<P>, present: present as PresenceOf<P>, version: schema.version };
}

/** Serialize declared, currently-active params only. Never encodes anything
 *  not named in the schema — in particular, never a computed output, since a
 *  schema never declares one. */
export function serialize<P extends ParamMap<Ctx>, Ctx = unknown>(
  state: StateOf<P>,
  schema: LinkSchema<P, Ctx>,
  ctx?: Ctx
): string {
  const p = new URLSearchParams();
  p.set('v', String(schema.version));
  const s = state as Record<string, unknown>;
  for (const key of Object.keys(schema.params)) {
    const def = schema.params[key];
    if (!isActive(def, ctx)) continue;
    p.set(key, String(s[key]));
  }
  return p.toString();
}

/** The one place a link updates the address bar: replaces, never pushes, so
 *  Back leaves the tool instead of stepping through keystrokes. A no-op
 *  outside a browser (SSR/prerender). */
export function writeLinkToAddressBar(qs: string): void {
  if (typeof window === 'undefined' || typeof history === 'undefined') return;
  history.replaceState(history.state, '', `?${qs}`);
}
