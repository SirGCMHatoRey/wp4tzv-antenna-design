# Shared design system & app shell

Type: prototype
Label: wayfinder:prototype
Status: resolved

## Question

What is the shared design system and app shell every calculator sits in — the concrete tokens (the datasheet palette, hairline rules, the Saira/Plex type system already chosen for the Loading Coil), the reusable components (readout strip, status bar with ok/warn/block, input field with unit, segmented control, reactance/diagram frame), the SvelteKit static/prerender + PWA shell, and the `/tools/*` + `/antennas/*` routing + navigation?

The Loading Coil prototypes already establish the visual language (ADR-0006) and the `Result` rendering (ADR-0008); this ticket lifts those into a portal-wide system + shell so every later calculator is assembly, not redesign. Foundational — most build work depends on it. Deliverable: a design-system + shell prototype/spec.

## Answer

Design-system + shell prototype built + published.

- **Asset (live):** https://claude.ai/code/artifact/afc3d01a-70ae-44fe-911a-cf256eb3065f
- **Source:** `.scratch/portal/assets/design-system-shell.html`

**Established portal-wide:**
1. **Tokens** — the datasheet palette (warm-biased neutrals, one amber accent doing focus+caution, critical/ok as the only semantics), both themes, spacing + rule weights.
2. **Type** — Saira Semi Condensed (display) / IBM Plex Sans (body) / IBM Plex Mono (data), self-hosted WOFF2 subsets.
3. **Component set** (the reusable kit every calculator assembles from): action/link buttons, input+unit (incl. dashed SOLVED output), segmented control, numbers-first readout strip, ok/warn/block status bar, **the Accuracy-Note + Method/Cite badge honesty pair**, data table, blueprint figure frame, Region/Band/Privilege selector, enforced ban-list.
4. **App shell** — sticky masthead (wordmark, Antennas▾/Tools▾ menus from the 24-calculator registry, Center-Frequency input, theme toggle) + footer (Region selector); static-prerender SvelteKit PWA; routes `/`, `/antennas/[model]`, `/tools/[tool]`, `/reference/*`; UI-state ⇄ versioned URL; localStorage saves.

**Formula:** every calculator = shell + component set + one `compute…` seam. Designers add a geometry diagram; Tools add a readout. Nothing re-decided per calculator. Governed by ADR-0006 (identity), ADR-0001/0004 (architecture), ADR-0008 (per-calculator seam) — no new ADR needed.

**Follow-ups:** unblocks *Homepage quick-calculator*. Firms up the future "shared closed-form Designer engine" ticket (still fog until Tier 1 is picked up). No new tickets.
