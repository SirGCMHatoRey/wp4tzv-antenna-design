# Coil datasheet diagram — the signature hero

Type: prototype
Label: wayfinder:prototype
Status: resolved

## Question

How should the signature hero — the live wound-coil datasheet diagram — look and behave? Schematic solenoid vs turn-accurate winding; how dimension callouts (N, d, ℓ) render; how the reactance strip shows the section `X_c` values being cancelled by `X_L`; how it updates as the user types; how it degrades on mobile.

Deliverable (linked asset via /prototype): a rough concrete artifact of the diagram to react to, in the engineering-datasheet aesthetic (ADR-0006 ban-list binding), using tabular/monospace numerals. This is the page's memorable element per /frontend-design — spend the boldness here, keep everything around it quiet.

## Answer

Prototype built + published (interactive, live-updating).

- **Asset (live):** https://claude.ai/code/artifact/e4a91b16-5a8d-4f0c-9c57-a2a51b3b3671
- **Source:** `.scratch/loading-coil/assets/coil-diagram-prototype.html`

**Decisions the prototype locks:**

1. **Fidelity = schematic-but-proportioned, not turn-accurate.** The solenoid honors the real d:ℓ aspect ratio but caps drawn turns at 40 and annotates the true `N` as a value. Turn-accurate winding was rejected — illegible at high N, and N is a readout, not something the user counts off the picture.
2. **The reactance-balance beam is the signature** (confirmed, keep). Hatched capacitive `−jX` bars for the lower/upper sections below a hard `jX = 0` axis, an amber inductive `+jX` coil bar above, and a `Σ jX → 0 ✓ resonant` readout. It shows the actual physics (cancellation) rather than decorating — subject-true, and the one bold element.
3. **Numbers-first layout order:** summary readout strip (L, N, Zc, Q, f-self) above the controls+diagram. Zc tagged `EXPOSED`; Q and f-self tagged `EST` to surface provenance inline (ADR-0002 honesty).
4. **One accent, disciplined:** instrument **amber** = accent + the active turn + caution/warn; **critical red** = hard block only; everything else ink/paper. Ban-list clean (no gradient / indigo / rounded-soup / emoji chrome / glow).
5. **Callouts:** ℓ dimension line below, d vertical at left, N as an amber leader to the highlighted centre turn, a `FIG.1 · <position> LOADED` corner tag. Blueprint grid-paper canvas, dashed core axis, drawn leads.
6. **Live behavior:** recompute on every input; the solve-mode segmented control dims + disables whichever of N/d/ℓ is the computed output; status chip flips ok/warn/block with a fix-oriented message.
7. **Responsive/quality floor:** grid collapses to one column on mobile (readout to 2-up), visible focus, reduced-motion respected, theme toggle + `prefers-color-scheme` both themes.

**Honesty note:** Stage-1 reactance (Zc, X, β·VF) is the real ADR-0007 math. Coil geometry, Q, and f-self are **placeholder estimates** (marked EST) — final values wait on *Nagaoka & Medhurst coefficient basis*; d/ℓ solve-modes wait on that ticket's root-finder, so the prototype solves N.

**Follow-ups:** unblocks *Solve-mode & validation layout*, which should extend this asset rather than start fresh. No new tickets surfaced.
