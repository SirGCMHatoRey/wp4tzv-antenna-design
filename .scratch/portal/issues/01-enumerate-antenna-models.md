# Enumerate the Antenna Models

Type: grilling
Label: wayfinder:grilling
Status: resolved

## Question

What is the canonical list of Antenna Models the portal ships (the Designers under `/antennas/*`), and for each: its Design Method (`closed-form` vs `published-design`), the citation/source, and whether it is a loading-coil candidate (electrically-short → offers the "Send to Loading Coil" handoff)?

CONTEXT names only Half-Wave Dipole and Quarter-Wave Vertical by example; ADR-0001 says "~23 calculators" total without a breakdown. Produce the enumerated, prioritized list (e.g. dipole variants, verticals, ground-plane, end-fed, loops, Yagi, etc.), each an eventual sub-effort. This is the master-list gap. Resolving it graduates the per-model design efforts out of Fog and sets build order.

## Answer

Enumerated, tiered list: **`.scratch/portal/assets/antenna-models-list.md`** — **16 Antenna Models** (+ 8 Tools ≈ 24, consistent with ADR-0001's "~23").

**Two scope calls (grilling):**
1. **Short/loaded antennas are NOT separate models** — full-size Designers offer a "shorten & load" deep-link into the Loading Coil tool. The **Quarter-Wave Vertical Designer is the primary handoff home** (resolves the coil map's "needs a short-vertical Designer" fog); Half-Wave Dipole offers a short-dipole variant.
2. **Full list, three build tiers:**
   - **T1 closed-form staples (9)** — dipole, inverted-V, folded dipole, ¼-wave vertical, 5/8 vertical, EFHW, quad loop, delta loop, random wire → **build first, share one λ×k engine**.
   - **T2 published-design (3)** — Yagi-Uda (DL6WU/NBS TN-688), Moxon, J-Pole/Slim-Jim.
   - **T3 complex/niche (4)** — magnetic loop, discone, G5RV, OCFD → each its own research sub-effort.

**Follow-ups:** graduates the per-model fog into a tiered backlog (not 15 tickets — the list *is* the itemization). The natural next graduated ticket is **a shared closed-form Designer engine** for Tier 1 (analogous to ADR-0008 for tools), which will surface once Tier 1 is picked up + the design system lands. No tickets created now (avoid over-slicing).
