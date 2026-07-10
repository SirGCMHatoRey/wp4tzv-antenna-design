import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Fully static / prerendered PWA — no server backend (ADR-0001, ADR-0004).
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    alias: {
      $components: 'src/lib/components'
    },
    // GitHub Pages serves under /<repo>/; set BASE_PATH in the deploy workflow.
    paths: {
      base: process.env.BASE_PATH ?? ''
    }
  }
};

export default config;
