# Region-aware band data with license classes and mandatory provenance

## Context

Amateur band edges vary by IARU Region (1/2/3) and, in the US, by License Class (Technician/General/Amateur Extra) and mode. The cross-band guard, band filter, and reference library all depend on this data. We chose the fullest scope: three regions plus US license-class privilege sub-bands. This data is regulatory and mutable — the FCC periodically refarms sub-bands (60m, 630m/2200m, symbol-rate rules) — so wrong values carry real liability (an operator could transmit out of privilege).

## Decision

- Band data is baked into the repo as a single source-of-truth file per authority (e.g. `bands/iaru-r1.ts`, `bands/us-fcc.ts`).
- Every dataset carries a **source citation (URL/CFR ref) and effective date** as data, not prose.
- Any UI that shows a band edge or Privilege displays "Band data as of {effectiveDate}, verify with your regulator before transmitting," plus a standing informational-only / not-legal-advice disclaimer.
- Region selector defaults to Region 2; US license-class detail is an overlay within Region 2.

## Consequences

- Ongoing maintenance burden: someone must review datasets against regulators and bump effective dates. This is accepted deliberately.
- The provenance fields are load-bearing, not decorative — components read `effectiveDate` to render the freshness notice.
- If maintenance lapses, the visible stale date is the safety net rather than a silently wrong number.
