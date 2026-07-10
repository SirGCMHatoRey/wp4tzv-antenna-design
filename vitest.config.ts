import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Unit tests target the two pure seams (engine + codec) and the physics lib.
// No SvelteKit plugin needed — just resolve the $lib alias to src/lib.
export default defineConfig({
  resolve: {
    alias: { $lib: resolve(import.meta.dirname, 'src/lib') }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
