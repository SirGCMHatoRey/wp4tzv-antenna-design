# Loading Coil: two-way Designer ⇄ Tool handoff

## Status

Accepted. Supersedes the one-way clause in ADR-0007's "Integration with Antenna Models" section (the "no shared state, no code coupling, no back-channel" language and the "one-way Designer→Tool URL handoff" framing). ADR-0007 itself is left as-is as a historical record.

## Context

ADR-0007 made the Designer → Loading Coil handoff a one-way deep link, and noted: "if a second such handoff appears, promote it to its own ADR." The one-way boundary stranded the ham's work: the coil designed in the tool (turns, form diameter, coil length) never made it back to the antenna page, and each new trip into the tool restarted from a fresh 60%-short prefill, discarding prior tuning.

The coil is now a first-class part of a loaded design, not a one-off computation.

## Decision

Make the handoff **two-way, still URL-only** (ADR-0004: no backend, no shared store, readable versioned query params).

- **Outbound (Designer → Loading Coil).** Besides the existing `f`, `pos`, `H`, `u`, the Designer adds `slug`, `k`, `apex` (when the model has one) and `g` (when the model has a ground system), so the tool can build a precise return link.
- **Return (Loading Coil → Designer).** With a `slug` present and a buildable coil, the tool shows "Back to Designer", linking to `/antennas/<slug>?f=&k=&apex=&g=&coil=`. The link is hidden — not disabled — for a blocked result.
- **Coil encoding.** `coil` is the Loading Coil's own query string (`codec.ts` `serialize`/`parse`), URL-encoded as one value. One encoding, not two. It is versioned by the codec's own `v`.
- **Designer display.** A `coil` param renders an additive "Loaded configuration" panel (L, N, d, ℓ, position, and the frequency the coil was sized for). The formula-length readout is unchanged. A frequency mismatch is surfaced, never silently recomputed.
- **Re-entry.** With a loaded coil the Designer's link reads "Edit coil →" and carries the *current* coil state, so repeated round trips are lossless.
- **Scope.** Only models flagged `loadable` (`half-wave-dipole`, `quarter-wave-vertical`). A standalone Loading Coil visit (no `slug`) is unchanged.

## Consequences

- The Designer and the tool now share a URL contract (`coil-handoff.ts`), but no runtime state and no backend.
- The Designer never renders a coil that is not buildable (`decodeCoil` returns null for a blocked result).
- A stale coil (frequency changed after the round trip) is flagged, not auto-re-solved.
- Editing the coil still happens only in the Loading Coil tool; the panel is read-only.
- Dimensions in the panel follow the global units switch.
