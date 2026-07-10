// Physical constants (SI). Shared across all Engineering Tools (ADR-0008).
// Kept exact and cited — no magic numbers baked into the tools (ADR-0002).

/** Speed of light, expressed so that λ[m] = C_M_MHZ / f[MHz]. */
export const C_M_MHZ = 299.792458;

/** Speed of light in vacuum, m/s. */
export const C = 299_792_458;

/** Vacuum permeability µ₀, H/m. */
export const MU0 = 4 * Math.PI * 1e-7;

/** Resistivity of annealed copper at 20 °C, Ω·m. */
export const RHO_COPPER = 1.724e-8;
