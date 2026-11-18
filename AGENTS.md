# WP4TZV Antenna Design — agent guide

Static-first SvelteKit PWA of amateur-radio antenna calculators. Every result is first-principles: derived, cited, and carrying an honest accuracy note. Scripts live in `package.json`; layout in `README.md`.

## Before you change code

Read `CONTEXT.md` and name things with its glossary terms (*Antenna Model*, *Engineering Tool*, *Designer*, *Correction Factor*, *Shareable Link*…). Read every ADR in `docs/adr/` that touches the area you are about to edit. How skills consume these: `docs/agents/domain.md`.

## Done means green

A change is done when `npm run check` reports 0 errors and 0 warnings and `npm run test` passes. Run `npm run build` too when you touch routes, `svelte.config.js`, or the service worker: the site is prerendered and a broken route fails only at build.

## Invariants

These are binding decisions. Contradicting one means surfacing it and opening a new ADR, not editing around it.

- **Physics is derived.** Lengths start from `λ = c/f` and apply an explicit, exposed Correction Factor `k` (ADR-0002). Write the formula with its factor named; a bare constant such as `143/f` is a bug.
- **Every Antenna Model declares its Design Method and citation** (ADR-0005). Multi-element antennas use digitized published designs scaled to frequency.
- **One seam per tool.** Each Engineering Tool exposes a single `compute…` entry returning the `Result` discriminated union; a blocked result carries no values. Tests assert on reason codes, the UI owns the copy. Shared primitives in `src/lib/physics/` are an internal contract: keep their signatures stable (ADR-0008).
- **Every link goes through the codec.** Designers and Tools declare their params as a schema for `src/lib/shareable-link.ts`, which owns parsing, defaults, totality and versioning (ADR-0010). Published link shapes are pinned by golden-string tests: changing one needs a version bump plus a `migrate_vN_vM`, so old links keep resolving to the same design.
- **No backend.** State lives in `localStorage` and URL params (ADR-0004). Links stay relative, because the site is served under the GitHub Pages sub-path via `BASE_PATH`.
- **Engineering-datasheet look** (ADR-0006): ink/paper palette, one amber accent, hairline rules, tabular/monospace numerals, tokens from `src/app.css`. Hard guardrail: gradients, indigo/purple accents, glow shadows and emoji in UI chrome are bugs.

## Gotchas

- **Fixtures can be wrong; physics wins.** The golden datasets under `.scratch/` already held three errors (rounded Lundin `k_L`, a reversed VF direction, an unbuildable default). When a fixture disagrees with verified physics, implement the physics and record the correction in code comments and the test.
- **CI runs `npm install`, not `npm ci`.** The lockfile is generated on Windows, and `npm ci` fails on Linux over esbuild's platform-specific optional deps.
- **Pushing to `main` deploys** to GitHub Pages. Work on a `feat/…`, `fix/…` or `docs/…` branch and merge through a PR.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `SirGCMHatoRey/wp4tzv-antenna-design`, managed via the `gh` CLI. External pull requests are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical vocabulary — each label string equals its role name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
