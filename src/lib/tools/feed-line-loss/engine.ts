// Feed Line Loss — approximating tool (declares method + Accuracy Note).
// Matched loss from the digitized coax dataset (published-design) + the
// closed-form SWR-added loss (ARRL Antenna Book).

import { coaxByKey, matchedLossPer100ft } from './coax';

const FT_PER_M = 3.280839895013123;

export interface FeedLineInputs {
  cableKey: string;
  lengthM: number;
  fMHz: number;
  swr: number; // SWR at the load (≥ 1)
}

export interface FeedLineResult {
  matchedLossDb: number;
  totalLossDb: number; // matched + SWR-added
  addedLossDb: number;
  pctDeliveredMatched: number; // % of input power reaching the load, matched
  pctDeliveredSwr: number; // % delivered under the given SWR
  z0: number;
}

export function computeFeedLineLoss(i: FeedLineInputs): FeedLineResult {
  const c = coaxByKey(i.cableKey);
  const lengthFt = Math.max(i.lengthM, 0) * FT_PER_M;
  const matchedLossDb = matchedLossPer100ft(c, i.fMHz) * (lengthFt / 100);

  const swr = Math.max(i.swr, 1);
  const rho = (swr - 1) / (swr + 1);
  const a = Math.pow(10, matchedLossDb / 10); // matched-line power ratio (≥ 1)

  // ARRL total loss under mismatch: 10·log10[(a² − ρ²) / (a(1 − ρ²))].
  const denom = a * (1 - rho * rho);
  const totalLossDb = denom > 0 ? 10 * Math.log10((a * a - rho * rho) / denom) : Infinity;
  const addedLossDb = totalLossDb - matchedLossDb;

  return {
    matchedLossDb,
    totalLossDb,
    addedLossDb,
    pctDeliveredMatched: 100 * Math.pow(10, -matchedLossDb / 10),
    pctDeliveredSwr: 100 * Math.pow(10, -totalLossDb / 10),
    z0: c.z0
  };
}
