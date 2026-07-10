import { MU0, RHO_COPPER } from './constants';

/**
 * Skin depth δ = √(ρ / (π f µ₀)) in metres, for a non-magnetic conductor.
 * @param fHz frequency in Hz
 * @param rho resistivity in Ω·m (defaults to copper)
 */
export function skinDepth(fHz: number, rho: number = RHO_COPPER): number {
  return Math.sqrt(rho / (Math.PI * fHz * MU0));
}
