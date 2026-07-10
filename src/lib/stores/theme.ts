import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';
const KEY = 'adp:theme';

function systemTheme(): Theme {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initial(): Theme {
  if (!browser) return 'light';
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return systemTheme();
}

function createTheme() {
  const { subscribe, set } = writable<Theme>(initial());

  function apply(t: Theme) {
    if (browser) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(KEY, t);
    }
    set(t);
  }

  return {
    subscribe,
    set: apply,
    toggle: () => {
      const current =
        (browser && (document.documentElement.getAttribute('data-theme') as Theme)) || systemTheme();
      apply(current === 'dark' ? 'light' : 'dark');
    }
  };
}

export const theme = createTheme();
