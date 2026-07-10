import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Center Frequency (CONTEXT): the single design frequency the user is cutting for,
// entered once in the masthead and carried into any calculator via the URL handoff.
// Persisted locally so it survives reloads; the canonical share vehicle is still the URL.

export type LengthUnit = 'm' | 'ft';

const F_KEY = 'adp:centerFreqMHz';
const U_KEY = 'adp:units';

function num(key: string, fallback: number): number {
  if (!browser) return fallback;
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function createCenterFreq() {
  const { subscribe, set } = writable<number>(num(F_KEY, 7.15));
  return {
    subscribe,
    set: (mhz: number) => {
      if (browser && Number.isFinite(mhz) && mhz > 0) localStorage.setItem(F_KEY, String(mhz));
      set(mhz);
    }
  };
}

function createUnits() {
  const start: LengthUnit = browser && localStorage.getItem(U_KEY) === 'ft' ? 'ft' : 'm';
  const { subscribe, set } = writable<LengthUnit>(start);
  return {
    subscribe,
    set: (u: LengthUnit) => {
      if (browser) localStorage.setItem(U_KEY, u);
      set(u);
    }
  };
}

/** Design frequency in MHz. Defaults to 40 m phone (Region 2). */
export const centerFreqMHz = createCenterFreq();
/** Global length-unit preference (?u= in shared links). */
export const units = createUnits();
