# Solve-mode & validation layout

Type: prototype
Label: wayfinder:prototype
Blocked by: 03
Status: resolved

## Question

How do the three solve modes and the hybrid validation surface in the datasheet layout — how picking "solve for N | d | ℓ" flips which two geometry fields are editable and which becomes the computed output; where the hard-block message sits (and how it disables the result) vs where the soft-warn caution badge (low Q / near self-resonance) sits; and how the Velocity-Factor, position, and units controls arrange around the hero diagram?

Blocked by *Coil datasheet diagram — the signature hero*: this layout wraps that diagram, so its composition can't be settled until the hero's form is known. Deliverable (linked asset via /prototype): a layout prototype with copy per /frontend-design (controls named by what the user does; blocks explain the fix in the interface's voice).

**Now unblocked** — *Coil datasheet diagram* is resolved. Its prototype already stubs the solve-mode segmented control, field dim/disable, and the ok/warn/block status chip. Extend that asset (`.scratch/loading-coil/assets/coil-diagram-prototype.html`) rather than starting fresh; this ticket refines the arrangement + validation copy, it doesn't rebuild the hero.

## Answer

Layout + validation-states prototype built + published.

- **Asset (live):** https://claude.ai/code/artifact/4ba31a9b-01e3-4000-824b-d5071a452505
- **Source:** `.scratch/loading-coil/assets/layout-states-prototype.html`

**Decisions locked:**

1. **Solve-mode field-flip:** the segmented `N | d | ℓ` control turns the chosen variable's input into a dashed, read-only **SOLVED** output field; the other two stay editable. One control, no separate output area.
2. **Blocks take over the hero:** on `ok:false` the coil diagram dims and a critical-tinted overlay states the problem + fix (there is no coil to draw — matches the discriminated-union "no values"). The solved readout cell(s) show `—`, never a stale number.
3. **Warns keep the result:** `ok:true` + warnings badges the *offending* readout cell (`LOW` on Q, `NEAR f` on f-self) in amber, result still shown. Status chip + one-line fix message in the status bar.
4. **Validation copy** (frontend-design, interface voice, fix-first): e.g. "Wire won't fit. 62 close-wound turns of #16 need 71 mm, but the coil is 50 mm. Use a coarser wire or a longer coil." / "No coil needed — the radiator is already at resonance here. Shorten it, or move the coil up."
5. **Composition:** controls rail (Stage 1 electrical / Stage 2 geometry) | hero (diagram + reactance beam); readout strip + status bar span full width above. Reactance beam collapses to "no coil required" on block.
6. Type system (Saira/Plex) + datasheet tokens applied; both themes; a labeled preview-state switcher demonstrates all five states.

No new tickets; no fog graduated. **This was the last frontier ticket — the map is fully walked.**
