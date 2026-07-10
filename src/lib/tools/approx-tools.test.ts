import { describe, it, expect } from 'vitest';
import { computeFeedLineLoss } from './feed-line-loss/engine';
import { matchedLossPer100ft, coaxByKey } from './feed-line-loss/coax';
import { computeBandwidth } from './bandwidth/engine';

describe('Feed Line Loss', () => {
  const m100ft = 100 / 3.280839895; // 100 ft in metres

  it('RG-213 matched loss ≈ 0.98 dB / 100 ft at 30 MHz', () => {
    expect(matchedLossPer100ft(coaxByKey('rg213'), 30)).toBeCloseTo(0.976, 2);
  });

  it('matched: total loss equals matched loss at SWR 1, no added loss', () => {
    const r = computeFeedLineLoss({ cableKey: 'rg213', lengthM: m100ft, fMHz: 30, swr: 1 });
    expect(r.matchedLossDb).toBeCloseTo(0.976, 2);
    expect(r.addedLossDb).toBeCloseTo(0, 6);
    expect(r.totalLossDb).toBeCloseTo(r.matchedLossDb, 6);
    expect(r.pctDeliveredMatched).toBeCloseTo(79.9, 0);
  });

  it('SWR adds loss above the matched value', () => {
    const matched = computeFeedLineLoss({ cableKey: 'rg58', lengthM: m100ft, fMHz: 14, swr: 1 });
    const mismatched = computeFeedLineLoss({ cableKey: 'rg58', lengthM: m100ft, fMHz: 14, swr: 3 });
    expect(mismatched.totalLossDb).toBeGreaterThan(matched.totalLossDb);
    expect(mismatched.addedLossDb).toBeGreaterThan(0);
    expect(mismatched.pctDeliveredSwr).toBeLessThan(matched.pctDeliveredMatched);
  });

  it('matched loss scales with length', () => {
    const short = computeFeedLineLoss({ cableKey: 'lmr400', lengthM: 10, fMHz: 50, swr: 1 });
    const long = computeFeedLineLoss({ cableKey: 'lmr400', lengthM: 30, fMHz: 50, swr: 1 });
    expect(long.matchedLossDb).toBeCloseTo(short.matchedLossDb * 3, 4);
  });

  it('lower-loss cable delivers more power', () => {
    const rg58 = computeFeedLineLoss({ cableKey: 'rg58', lengthM: m100ft, fMHz: 146, swr: 1 });
    const lmr = computeFeedLineLoss({ cableKey: 'lmr400', lengthM: m100ft, fMHz: 146, swr: 1 });
    expect(lmr.pctDeliveredMatched).toBeGreaterThan(rg58.pctDeliveredMatched);
  });
});

describe('Bandwidth', () => {
  it('2:1 SWR bandwidth = (f/Q)·(SWR−1)/√SWR', () => {
    const r = computeBandwidth({ fMHz: 7.15, q: 13, targetSwr: 2 });
    expect(r.bw3dbMHz).toBeCloseTo(7.15 / 13, 4);
    expect(r.bwMHz).toBeCloseTo((7.15 / 13) * (1 / Math.sqrt(2)), 4);
  });

  it('band edges straddle the design frequency symmetrically', () => {
    const r = computeBandwidth({ fMHz: 14.2, q: 12, targetSwr: 2 });
    expect((r.fLowMHz + r.fHighMHz) / 2).toBeCloseTo(14.2, 6);
    expect(r.fHighMHz - r.fLowMHz).toBeCloseTo(r.bwMHz, 6);
  });

  it('higher Q narrows the bandwidth', () => {
    const lo = computeBandwidth({ fMHz: 7.15, q: 10, targetSwr: 2 }).bwMHz;
    const hi = computeBandwidth({ fMHz: 7.15, q: 200, targetSwr: 2 }).bwMHz;
    expect(hi).toBeLessThan(lo);
  });
});
