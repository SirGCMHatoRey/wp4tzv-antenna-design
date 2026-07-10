# Enumerate the Engineering Tools

Type: grilling
Label: wayfinder:grilling
Status: resolved

## Question

What is the canonical list of Engineering Tools under `/tools/*`, beyond the eight already named in CONTEXT (SWR, Feed Line Loss, Balun ratio, Wavelength, Velocity Factor, Bandwidth, Resonant Frequency, Loading Coil)? For each: is it exact or approximating (does it declare a Design Method + Accuracy Note per the widened glossary), and what are its inputs/output?

Confirm the set, flag any missing tools, and mark which are trivial (exact one-liners like Wavelength) vs. which need real design (like Loading Coil did). Resolving this graduates the per-tool design efforts out of Fog and sets build order (Loading Coil already done).

## Answer

Classified list: **`.scratch/portal/assets/engineering-tools-list.md`**. Confirmed **the 8 CONTEXT names, complete** (16 models + 8 tools = 24 ≈ ~23).

- **Exact — trivial one-liners (5):** Wavelength, Velocity Factor, Resonant Frequency, Balun ratio, SWR. No Design Method / Accuracy Note; batch-build on the shared tool shell (only the `ok:true` branch).
- **Approximating — declare method + Accuracy Note (3):** Feed Line Loss (published coax-loss data + SWR-added-loss), Bandwidth (BW = f/Q + Q estimate), Loading Coil (✅ done).

**Build order (tools track):** Loading Coil → the 5 exact one-liners (quick wins) → Feed Line Loss (needs a digitized coax-loss dataset — a research sub-effort mirroring the coefficient-basis ticket) → Bandwidth.

**Follow-ups:** master list complete. Per-tool efforts itemized as a backlog (no new tickets — avoid over-slicing). One concrete future research need flagged: the **coax-loss dataset** for Feed Line Loss, graduates when that tool is picked up.
