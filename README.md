# WP4TZV Antenna Design

**Live:** https://sirgcmhatorey.github.io/wp4tzv-antenna-design/

The WP4TZV station's static-first Progressive Web App of amateur-radio antenna
calculators, engineering tools, and interactive diagrams — for hams, RF engineers,
students, and makers.

Every result is **first-principles**: it shows its correction factor, its design method,
and an honest accuracy note. No magic numbers. All math runs client-side and works offline.

## What's inside

**Engineering Tools** (`/tools/*`) — 8 of 8 built:

| Tool | Method | Notes |
|------|--------|-------|
| Loading Coil | closed-form (±10%) | Two-stage: required inductance (transmission-line stub, exposed Zc) → buildable coil geometry (Nagaoka current-sheet). Signature diagram + reactance-balance beam, solve-mode flip, shareable URL, saved projects. |
| Wavelength | exact | λ = c/f, physical length × VF |
| Velocity Factor | exact | measured lengths or material preset |
| Resonant Frequency | exact | LC tank or half-wave element |
| Balun Ratio | exact | n = √(Z_out/Z_in) |
| SWR | exact | complex Z or fwd/rev power → SWR, \|Γ\|, return/mismatch loss |
| Feed Line Loss | published-design + closed-form | digitized coax dataset + SWR-added loss |
| Bandwidth | closed-form | BW = (f/Q)·(SWR−1)/√SWR |

**Antenna Model Designers** (`/antennas/*`) — 9 of 16 built (all Tier 1, one shared λ×k engine):
Half-Wave / Inverted-V / Folded Dipole, Quarter-Wave & 5/8-Wave Vertical, End-Fed Half-Wave,
Full-Wave (Quad) & Delta Loop, Random/Long Wire. Loadable models deep-link into the Loading Coil.

Tier 2 (Yagi-Uda, Moxon, J-Pole) and Tier 3 (Magnetic Loop, Discone, G5RV, Windom OCF)
currently render a "not built yet" stub.

## Architecture

- **Static / prerendered SvelteKit 2 + Svelte 5**, `adapter-static`. No server backend.
- **No accounts.** Saved Projects use `localStorage`; designs are shared via readable,
  versioned URL params (`?f=7.15&…`). Installable PWA with an offline service worker.
- **Two pure test seams per tool** — a physics engine and a URL/state codec — both
  framework-agnostic TypeScript. The UI is thin over them.
- **Shared physics library** (`src/lib/physics/`): wavelength, Nagaoka (Lundin 1985),
  Brent root-finder, skin depth.
- **Engineering-datasheet visual identity** — restrained ink/paper palette + one amber
  accent, hairline rules, tabular/monospace numerals, self-hosted fonts. A binding
  ban-list (no gradients, indigo, glow, emoji chrome) keeps it from reading as generic.

Design decisions are recorded as ADRs in [`docs/adr/`](docs/adr) and the ubiquitous-language
domain model in [`CONTEXT.md`](CONTEXT.md). Planning artifacts (PRD, research, prototypes)
live under `.scratch/`.

## Project layout

```
src/
  lib/
    physics/            shared pure physics (wavelength, nagaoka, rootfind, skinDepth)
    tools/<slug>/       one engine.ts seam per Engineering Tool (+ codec, data assets)
    antennas/           shared Designer engine + data-driven model specs + Designer.svelte
    components/         datasheet component kit (readout, status, accuracy note, …)
    stores/             theme + center-frequency / units
    registry.ts         the 24-calculator registry (nav, routes, listings)
  routes/               /, /tools/*, /antennas/[slug], /reference
  app.css               design-system tokens + component classes
static/fonts/           self-hosted WOFF2 subsets (SIL OFL — see NOTICE)
docs/adr/               architecture decision records
```

## Develop

```bash
npm install
npm run dev        # dev server
npm run check      # svelte-check (types + a11y)
npm run test       # vitest — golden-dataset engine + codec tests
npm run build      # static build → build/
npm run preview    # preview the production build
```

Physics correctness is covered by 56 vitest cases, including a golden-reference dataset
for the Loading Coil (Nagaoka/Lundin identity chain, worked coils, solve-mode round-trips,
status codes, codec round-trips).

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The build sets
`BASE_PATH=/<repo>` so the app works under the Pages sub-path; prerendered links
are relative, so it also runs from the repo root or any other host. Serve the
`build/` directory on any static host to self-host.

## License

Code is MIT (see [`LICENSE`](LICENSE)). Bundled fonts (Saira Semi Condensed, IBM Plex
Sans/Mono) are under the SIL Open Font License 1.1 — see [`static/fonts/NOTICE.md`](static/fonts/NOTICE.md).

## Attribution

🤖 Built with [Claude Code](https://claude.com/claude-code).
