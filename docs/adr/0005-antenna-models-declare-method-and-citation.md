# Every Antenna Model declares its design method and citation

## Context

Antenna Models fall on a spectrum of derivability. A dipole or quarter-wave vertical is a legitimate closed-form `λ/2 × k` calculation. A Yagi or LPDA is not — its dimensions come from measured/optimized published procedures (DL6WU, NBS Technical Note 688, Carrel's LPDA method), and naive per-element λ-scaling produces poorly-performing, mismatched antennas. Mixing genuine formulas with invented ones, unlabeled, is exactly the amateur/AI fingerprint the project is trying to avoid.

## Decision

Every Antenna Model carries an explicit **design method** (`closed-form` or `published-design`) and, when applicable, a **citation** (source + reference). Multi-element antennas ship digitized published designs scaled to frequency, not per-element scaling. The Designer surfaces the method and citation in the antenna's accuracy notes ("design per NBS TN-688").

## Consequences

- The Antenna Model type has required `method` and (conditionally) `citation` fields — load-bearing, rendered in the UI.
- Adding a new antenna forces the author to answer "where do these numbers come from?" before it ships.
- Some antennas depend on tabulated data (arrays of element lengths/spacings), not just a formula — the data layer must accommodate both shapes.
