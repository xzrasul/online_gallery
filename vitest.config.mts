import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each Neon HTTP query takes ~200 ms (the first ~750 ms), so DB tests can
    // exceed vitest's 5 s default on a cold start.
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
});
