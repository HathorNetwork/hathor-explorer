import { defineConfig } from '@playwright/test';

/**
 * E2E suite for hathor-explorer. Playwright boots the app's own CRA dev server locally and
 * points it at the REAL public mainnet backends. The explorer is read-only and stateless, so
 * tests run fully parallel.
 *
 * Env override: `webServer.env` sets OS-level env for the spawned dev server. CRA's dotenv
 * loader does NOT override variables already present in process.env, so these win over the
 * committed `.env.local` (which targets the localnet docker).
 */
const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  tsconfig: './tests/e2e/tsconfig.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Real public backends can be slow; be generous.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1366, height: 900 }, // desktop: top-nav links are visible (not mobile burger)
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The explorer-service API Gateway only allows CORS from https://explorer.hathor.network.
    // When running locally against localhost:3002 we must bypass CORS enforcement so the
    // versionApi.getVersion() and other explorer-service calls succeed in the browser.
    launchOptions: {
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
    },
  },
  webServer: {
    // `npm start` (not `start-js`) so the SCSS is compiled+watched alongside the dev server —
    // `start-js` alone skips CSS, which can make styled elements read as hidden in Playwright.
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      BROWSER: 'none', // don't auto-open a browser tab
      PORT: String(PORT),
      REACT_APP_BASE_URL: 'https://node.explorer.hathor.network/v1a/',
      REACT_APP_EXPLORER_SERVICE_BASE_URL: 'https://explorer-service.hathor.network/',
      REACT_APP_WS_URL: 'wss://node.explorer.hathor.network/v1a/ws/',
      REACT_APP_NETWORK: 'mainnet',
      REACT_APP_EXPLORER_MODE: 'full',
      // no SKIP_FEATURE_TOGGLE -> real Unleash
    },
  },
});
