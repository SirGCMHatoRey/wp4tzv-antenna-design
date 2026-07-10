# Research: defensible defaults & band presets

Asset for ticket *Defensible defaults & band presets*. Every shipped default is sourced — none is a magic number (ADR-0002). Band presets seed a **Design Frequency** only; band *edges* stay owned by the Region / Band / Privilege model (CONTEXT), default **Region 2**.

## Input defaults

| Input | Default | Basis / source |
|-------|---------|----------------|
| Velocity Factor — bare wire/tubing | **0.96** | Bare copper in air VF ≈ 0.95–0.98; 0.96 is mid-range. Conductor-propagation VF only, **not** the resonant 0.95 end-effect `k` (ADR-0007). |
| Velocity Factor — PVC-insulated | **0.94** | PVC-insulated antenna wire VF ≈ 0.93–0.95. |
| Radiator height H | **2.5 m** | Typical HF mobile whip / short vertical length. |
| Conductor radius a | **3.2 mm** | ¼-inch (6.35 mm dia) whip/rod — the common mobile-whip mast radius. |
| Loading Position | **center** | Best efficiency of the two common cases; the tool's headline use. |
| Form diameter d | **25 mm** | 1-inch coil form — the ubiquitous ham loading-coil former. |
| Coil length ℓ | **50 mm** | ~2-inch winding on a 1-inch form → ℓ/d ≈ 2, squarely in the accurate Nagaoka + Medhurst regime. |
| Wire | **#16 AWG** | Common HF loading-coil gauge (good Q vs. bulk trade). |
| Winding | **close-wound** | pitch = wire diameter; the default build. |

**Derived, not defaulted — Zc.** With the H/a defaults, `Zc = 60·[ln(2H/a) − 1] = 60·[ln(2·2.5/0.0032) − 1] ≈ 381 Ω`. Typical whips land ~380–600 Ω. Zc is always shown (EXPOSED), never a stored constant.

## Band presets — Design Frequency seed (default Region 2)

Each preset just sets the starting Design Frequency; the operator can type any value, and Region/License-Class rules govern legality elsewhere.

| Band | Preset f (MHz) | Note |
|------|----------------|------|
| 160 m | 1.900 | |
| 80 m | 3.700 | R2 edge to 4.000 (US); R1/R3 lower — Region model owns edges |
| 40 m | 7.150 | R2 to 7.300; R1/R3 to 7.200 |
| 30 m | 10.125 | WARC, all regions |
| 20 m | 14.175 | |
| 17 m | 18.110 | WARC |
| 15 m | 21.225 | |
| 12 m | 24.940 | WARC |
| 10 m | 28.500 | wide band; mid-phone seed |

Main-band edges (160/80/40/20/15/10) are internationally consistent; the **80 m and 40 m upper edges are the real Region-2 vs Region-1/3 difference**, already handled by the Region/Band model — presets need no per-region variants, only the seed frequency above.

## Notes for the engine

- Defaults live in the tool's config, not hard-coded in the physics (`src/lib/tools/loading-coil/`), so the versioned URL schema can omit-at-default (ADR-0008 codec).
- Loading coils are most-used on the low bands (160/80/40 m) where whips are electrically shortest — bias any onboarding copy there.

## Sources

- [LowPowerLab — Velocity Factor](https://lowpowerlab.com/guide/rf-best-practices/velocity-factor/)
- [KB6NU — insulated-wire dipoles / velocity factor](https://www.kb6nu.com/should-dipoles-made-with-insulated-wire-be-made-shorter/)
- [IARU Region 2 Band Plan (2016)](https://www.iaru.org/wp-content/uploads/2020/01/R2-Band-Plan-2016.pdf)
- [IARU Amateur Services Spectrum (2020)](https://www.iaru.org/wp-content/uploads/2020/01/Amateur-Services-Spectrum-2020_.pdf)
- [Amateur radio frequency allocations — Wikipedia](https://en.wikipedia.org/wiki/Amateur_radio_frequency_allocations)
