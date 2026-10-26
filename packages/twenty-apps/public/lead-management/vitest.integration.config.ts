import { defineConfig } from 'vitest/config';

// Integration tests run against a real Twenty server (local docker:start
// or the CI spawn-twenty-app-dev-test action). Kept separate from the unit
// config so `yarn test` stays hermetic and never touches a server.

const TWENTY_API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:2020';
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? '';

// Make env vars available to globalSetup (test.env only applies to workers)
process.env.TWENTY_API_URL = TWENTY_API_URL;
if (TWENTY_API_KEY) {
  process.env.TWENTY_API_KEY = TWENTY_API_KEY;
}

export default defineConfig({
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    include: ['src/**/*.integration-test.ts'],
    globalSetup: ['src/__tests__/global-setup.ts'],
    env: {
      TWENTY_API_URL,
      TWENTY_API_KEY,
    },
  },
  resolve: {
    alias: {
      src: new URL('./src/', import.meta.url).pathname,
    },
  },
});
