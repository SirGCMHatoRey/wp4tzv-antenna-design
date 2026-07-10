# Band / Region / Privilege data model

Asset for ticket *Band / Region / Privilege data model*. The shared static frequency data every calculator consumes (Designers, Loading Coil band presets, homepage quick-calc, the Region selector). Realizes the CONTEXT terms Region / Band / License Class / Privilege directly — no glossary change.

## Schema

```ts
type RegionId = 1 | 2 | 3;                       // IARU; default 2
type LicenseClass = 'Technician' | 'General' | 'Extra';   // US/FCC only
type Mode = 'cw' | 'phone' | 'data';             // optional — deferred in v1 seed

interface Privilege {                            // finest datum (CONTEXT)
  class: LicenseClass;
  mode?: Mode;                                   // omitted in v1 (class-only seed)
  lo: number; hi: number;                        // MHz
}
interface Band {
  name: string;                                  // '40m'
  wavelength: string;                            // '40 m'
  edges: { lo: number; hi: number };             // region-wide edges (MHz)
  us?: Privilege[];                              // OPTIONAL — present only in Region 2
}
interface Region { id: RegionId; name: string; bands: Band[]; }
```

**Key modeling notes**
- `us` is **optional** and present only on Region 2 bands — Regions 1/3 are just `edges` (grilling Q1). No degenerate privileges anywhere.
- `Privilege[]` may hold **multiple non-contiguous segments per class** (e.g. US General 80m is two ranges) — the array handles it naturally.
- `mode` is on the type (honors CONTEXT's `(class, band, mode)` definition) but **left undefined in the v1 seed** (class-only). Adding mode-level segments later needs no schema change (grilling Q2).

## Query

```ts
legalEdges(region, band, cls?, mode?): { lo, hi } | { lo, hi }[]
```

- Non-US (Region 1/3, or Region 2 with no `cls`): return `band.edges`.
- Region 2 + `cls`: return the `us` privilege segment(s) for that class (intersected with `mode` if given and present). May be multiple segments.
- A calculator seeds its Design Frequency from the **midpoint of the applicable range** (ties to the Loading Coil band presets + Center Frequency).

## Where it lives

- `src/lib/data/bands/` — static JSON per region (`region-2.json`, …), no framework deps.
- Consumed by: the Region/Band/Privilege selector component (design system), Designers, Loading Coil presets, homepage quick-calc.

## Seed sample (representative — verify full table at data-entry time)

```jsonc
// region-2.json (US/FCC overlay)
{ "id": 2, "name": "Americas", "bands": [
  { "name": "40m", "wavelength": "40 m", "edges": { "lo": 7.000, "hi": 7.300 },
    "us": [
      { "class": "Extra",      "lo": 7.000, "hi": 7.300 },
      { "class": "General",    "lo": 7.025, "hi": 7.125 },
      { "class": "General",    "lo": 7.175, "hi": 7.300 },
      { "class": "Technician", "lo": 7.025, "hi": 7.125 }
    ] },
  { "name": "20m", "wavelength": "20 m", "edges": { "lo": 14.000, "hi": 14.350 },
    "us": [
      { "class": "Extra",   "lo": 14.000, "hi": 14.350 },
      { "class": "General", "lo": 14.025, "hi": 14.150 },
      { "class": "General", "lo": 14.225, "hi": 14.350 }
    ] }
] }
```

```jsonc
// region-1.json (no US overlay — edges only)
{ "id": 1, "name": "EMEA", "bands": [
  { "name": "40m", "wavelength": "40 m", "edges": { "lo": 7.000, "hi": 7.200 } },
  { "name": "20m", "wavelength": "20 m", "edges": { "lo": 14.000, "hi": 14.350 } }
] }
```

## Deferred (data-entry tasks, not decisions)

- **Full band table** for all HF/VHF bands × 3 regions, and the complete US class sub-bands — hand-digitize from the cited sources. The schema + query + these samples are the pattern; the rest is data entry.
- **Mode-level segments** — fill `mode` when class×mode precision is wanted (schema already supports it).

## Sources

- [IARU Region 2 Band Plan (2016)](https://www.iaru.org/wp-content/uploads/2020/01/R2-Band-Plan-2016.pdf) · [IARU Amateur Services Spectrum](https://www.iaru.org/wp-content/uploads/2020/01/Amateur-Services-Spectrum-2020_.pdf)
- FCC §97.301 / §97.305 (US frequency + emission privileges) via [ARRL band chart](http://www.arrl.org/graphical-frequency-allocations)
- CONTEXT.md (Region, Band, License Class, Privilege, Center/Design Frequency)
