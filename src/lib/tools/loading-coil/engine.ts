// The single public seam (ADR-0008): computeLoadingCoil(inputs) → Result.
// Sub-functions in stub.ts / coil.ts are pure internals (test-exported).

import { nagaokaKL } from '$lib/physics/nagaoka';
import { requiredInductance } from './stub';
import { currentSheetL, solveGeom, selfCapacitance, fSelf, qFactor } from './coil';
import type { Coil, EngineInputs, Reason, Result, SolveMode } from './types';

/** Below this the coil is flagged low-Q (lossy). Advisory threshold. */
export const LOW_Q_THRESHOLD = 100;
/** Warn when f_self is within this multiple of the design frequency. */
export const SELF_RES_MARGIN = 2.5;

function fixedPair(inputs: EngineInputs, mode: SolveMode) {
  return {
    N: mode === 'N' ? undefined : inputs.N,
    d: mode === 'd' ? undefined : inputs.d,
    len: mode === 'len' ? undefined : inputs.len
  };
}

export function computeLoadingCoil(inputs: EngineInputs): Result {
  // ---- Stage 1: required inductance ----
  const stub = requiredInductance(inputs);
  if (stub.alreadyResonant) {
    return {
      ok: false,
      blocks: [{ code: 'ALREADY_RESONANT', xReqOhm: stub.xReqOhm }]
    };
  }
  const Ltarget = stub.reqInductanceH;

  // ---- Stage 2: solve the chosen geometry variable ----
  const solved = solveGeom(Ltarget, inputs.mode, fixedPair(inputs, inputs.mode));
  if (solved === null || !Number.isFinite(solved) || solved <= 0) {
    return { ok: false, blocks: [{ code: 'NO_REAL_SOLUTION', LuH: Ltarget * 1e6 }] };
  }

  const N = inputs.mode === 'N' ? solved : (inputs.N as number);
  const d = inputs.mode === 'd' ? solved : (inputs.d as number);
  const len = inputs.mode === 'len' ? solved : (inputs.len as number);

  // ---- Wire-fit (close-wound): N turns each wireDiam wide need N·wireDiam axially ----
  const needM = N * inputs.wireDiam;
  if (needM > len + 1e-9) {
    return {
      ok: false,
      blocks: [{ code: 'WIRE_WONT_FIT', needMm: needM * 1000, haveMm: len * 1000, turns: N }]
    };
  }

  // ---- Advisory figures ----
  const Lactual = currentSheetL(N, d, len);
  const pitch = inputs.wireDiam; // close-wound
  const q = qFactor(inputs.fHz, Lactual, N, d, len, inputs.wireDiam, pitch);
  const cSelf = selfCapacitance(d, len);
  const fSelfHz = fSelf(Lactual, cSelf);

  const warnings: Reason[] = [];
  if (q < LOW_Q_THRESHOLD) warnings.push({ code: 'LOW_Q', q });
  if (fSelfHz < SELF_RES_MARGIN * inputs.fHz) {
    warnings.push({ code: 'NEAR_SELF_RESONANCE', fSelfMHz: fSelfHz / 1e6, fMHz: inputs.fHz / 1e6 });
  }

  const values: Coil = {
    reqInductanceH: Ltarget,
    LuH: Ltarget * 1e6,
    zcOhm: stub.zcOhm,
    xLowerOhm: stub.xLowerOhm,
    xUpperOhm: stub.xUpperOhm,
    xReqOhm: stub.xReqOhm,
    betaLowerDeg: stub.betaLowerDeg,
    betaUpperDeg: stub.betaUpperDeg,
    N,
    dM: d,
    lenM: len,
    kL: nagaokaKL(d, len),
    qEst: q,
    cSelfF: cSelf,
    fSelfMHz: fSelfHz / 1e6
  };

  return { ok: true, values, warnings };
}
