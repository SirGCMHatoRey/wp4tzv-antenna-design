---
status: accepted
---

# Visual identity: engineering datasheet

## Context

The "no AI fingerprints" goal is won or lost on visual identity. Default SvelteKit + Tailwind output — indigo/purple accent, gradient hero, oversized rounded cards, soft glow shadows, emoji — is itself the recognisable AI-generated fingerprint.

## Decision

**Engineering datasheet** aesthetic (option 1). Restrained ink/paper palette + one signal accent, hairline rules, monospace/tabular numerals for dimensions and formulas, diagram-first and information-dense. The ban-list below is binding.

## Options considered

1. **Engineering datasheet (recommended).** Blueprint/technical aesthetic: restrained ink/paper palette + one signal accent, hairline rules, monospace/tabular numerals for dimensions and formulas, diagram-first and information-dense.
2. **Clean modern minimal.** Neutral, airy, sans-serif, subtle borders. Safer but risks reading as generic template.
3. **Retro ham/CRT.** Phosphor-green terminal/vintage-rig nostalgia. Characterful and clearly non-generic, but undercuts the "professional engineering" tone.

## Proposed ban-list (applies regardless of option chosen)

Gradients (esp. hero), indigo/purple accents, `rounded-3xl` card soup, emoji in UI chrome, soft glow shadows. These are the specific tells to avoid.

## Consequences

Design system and Tailwind config encode the palette, hairline rules, and tabular-figure fonts. The ban-list is enforced in review; a generic/gradient/indigo screen is a bug, not a style preference.
