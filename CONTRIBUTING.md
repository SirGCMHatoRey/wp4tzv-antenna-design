# Contributing

Thanks for helping improve the WP4TZV Antenna Design portal. This project values results an RF engineer can defend: every number is derived, cited, and honest about its accuracy.

## Reporting a problem or idea

Open a [GitHub issue](https://github.com/SirGCMHatoRey/wp4tzv-antenna-design/issues/new/choose). New issues get the `needs-triage` label; a maintainer then marks them `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`.

For a wrong result, include the Shareable Link (the page URL with its `?…` params), what the tool shows, what you expected, and the source for the expected value (handbook, measurement, NEC model). A link reproduces the exact design.

Pull requests are reviewed, but feature requests belong in an issue first so the approach can be agreed before code is written.

## Development setup

Requires Node 22 (matching CI).

```bash
npm install
npm run dev
```

Before opening a PR, all three must pass:

```bash
npm run check   # svelte-check: 0 errors, 0 warnings
npm run test    # vitest
npm run build   # static prerender
```

## How the code is organised

Read [`CONTEXT.md`](CONTEXT.md) for the project's vocabulary and the ADRs in [`docs/adr/`](docs/adr) for the decisions behind the architecture. The short version:

- **Engineering Tools** (`src/lib/tools/<slug>/`) expose one pure `compute…` function and a URL codec. Both are framework-free TypeScript with their own tests; the Svelte UI is thin over them.
- **Antenna Model Designers** (`src/lib/antennas/`) are data-driven specs over a shared engine.
- **Shared physics** (`src/lib/physics/`) holds primitives used across tools. Treat its signatures as stable.
- **Shareable Links** go through `src/lib/shareable-link.ts`. A link someone has already shared must keep opening the same design.

## Standards for physics changes

- Derive from first principles (`λ = c/f` with an explicit correction factor) rather than a bare constant.
- Give every Antenna Model a Design Method (`closed-form` or `published-design`), a citation when applicable, and an accuracy note.
- Add or update a test with a worked, cited reference value. If a published reference turns out to be wrong, say so in the test and in a code comment.

## Visual design

The site follows an engineering-datasheet identity ([ADR-0006](docs/adr/0006-visual-identity.md)): ink/paper palette, one amber accent, hairline rules, tabular numerals. Use the tokens in `src/app.css`. Gradients, indigo/purple accents, glow shadows and emoji in UI chrome will be sent back in review.

## Pull requests

- Branch from `main` as `feat/…`, `fix/…` or `docs/…`. Merging to `main` deploys the live site.
- Write commit messages as short imperative sentences ("Add Moxon Antenna Model").
- Link the issue the PR resolves, and note any ADR the change touches or contradicts.
- Record a new architectural decision as a new ADR in `docs/adr/`.

## License

By contributing you agree your contribution is licensed under the [MIT License](LICENSE). Bundled fonts remain under the SIL Open Font License 1.1.
