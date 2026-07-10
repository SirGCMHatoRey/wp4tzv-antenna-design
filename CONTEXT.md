# Amateur Radio Antenna Design Portal

A public, static-first PWA of antenna calculators, engineering references, and interactive diagrams for hams, RF engineers, students, and makers. All calculators are pure client-side math; a thin save API persists work anonymously.

## Language

**Antenna Model**:
The engineering definition of one antenna type (e.g. Half-Wave Dipole) — its equations, default correction factor, construction notes, and diagram. The unit of content in `src/lib/data/antennas`.
_Avoid_: antenna type, design, template

**Engineering Tool**:
A calculator that takes electrical parameters and returns a scalar/utility value — or the geometry of a single discrete component (a coil, a stub), never a whole Antenna Model — with no Designer to render (SWR, Feed Line Loss, Balun ratio, Wavelength, Velocity Factor, Bandwidth, Resonant Frequency, Loading Coil). Lives under `/tools/*`. The sibling concept to Antenna Model.
_Avoid_: calculator (too generic), widget

**Designer**:
The interactive UI that renders one Antenna Model: frequency + options in, geometry + diagram + construction notes out. Lives under `/antennas/*`.
_Avoid_: calculator, tool, widget

**Correction Factor (k)**:
The multiplier applied to a free-space dimension to account for velocity factor and end effect for a given conductor/construction. Exposed and explained; not hidden inside a constant.
_Avoid_: fudge factor, magic number

**Design Method**:
How a result is produced: `closed-form` (physics from first principles, e.g. λ/2 × k, or a transmission-line/Nagaoka model) or `published-design` (digitized from a cited measured/optimized source like DL6WU, NBS TN-688, Carrel). A required, displayed property of every Antenna Model, and of every Engineering Tool that models real physics with a method choice (e.g. Loading Coil). Exact tools (Wavelength, SWR) have no Design Method.
_Avoid_: algorithm, formula type

**Accuracy Note**:
The honest statement of a result's basis, assumptions, and expected error (e.g. "free-space pattern," "±3%, trim to resonance," "design per NBS TN-688"). Required on every Antenna Model, and on every Engineering Tool that approximates real physics (e.g. Loading Coil: "±~10%, average-Zc approximation"). Exact tools have none. Distinguishes the site from magic-number calculators.
_Avoid_: disclaimer (reserved for regulatory band text)

**Velocity Factor**:
The ratio of signal speed in a medium (wire insulation, coax dielectric) to the speed of light. A physical property of a material; a distinct standalone calculator. A component of, but not synonymous with, Correction Factor: transmission-line/stub models (e.g. Loading Coil) apply Velocity Factor alone, whereas the full Correction Factor (VF × end-effect) applies only to resonant λ/2 elements.
_Avoid_: VF-as-k

**Loading Coil**:
A series inductor inserted into an electrically short radiator to cancel its residual capacitive reactance and bring it to resonance. As an Engineering Tool it works in two stages: the required inductance to resonate, then the physical coil geometry that realizes it.
_Avoid_: loading inductor, base coil (position-specific), trap (a trap is resonant, a loading coil is not)

**Loading Position**:
Where the Loading Coil sits along the radiator — base, center, or an arbitrary height fraction. Determines how the radiator is split into sections (each modeled as a transmission-line stub) when computing the reactance to cancel. Base = split point at the feed.
_Avoid_: coil location, tap point

**Region**:
An IARU region (1 = EMEA, 2 = Americas, 3 = APAC) that determines amateur band edges. The top-level geographic scope for band data. Defaults to Region 2.
_Avoid_: zone, area

**Band**:
A named amateur allocation (e.g. "40m") whose frequency edges depend on Region and, in the US, License Class.
_Avoid_: channel

**License Class**:
A US operator privilege tier (Technician, General, Amateur Extra) that gates which sub-bands and modes are usable. Applies only inside the US/FCC overlay of Region 2.
_Avoid_: license level, grade

**Privilege**:
A (License Class, Band, Mode) sub-range the operator is permitted to transmit on — e.g. General phone on 40m is 7.175–7.300 MHz. The finest-grained band datum.
_Avoid_: sub-band (ambiguous), allocation

**Center Frequency**:
The design frequency derived from the operator's one or two most-used frequencies on the homepage quick calculator. The single frequency the antenna is cut for.
_Avoid_: mid frequency, average frequency

**Design Frequency**:
The frequency an Antenna Model is currently being calculated for. Equals the Center Frequency when driven from the homepage.
_Avoid_: target frequency, operating frequency

**Saved Project**:
A named snapshot of a Designer's or Tool's inputs (and chosen units) persisted in the browser's `localStorage`. Per-browser, no login, no server.
_Avoid_: saved design, session

**Shareable Link**:
A URL that encodes a design's inputs as query params (`?f=7.15&u=m`). The mechanism for sharing and deep-linking; the param schema is a stable, versioned public interface.
_Avoid_: share code, permalink token
