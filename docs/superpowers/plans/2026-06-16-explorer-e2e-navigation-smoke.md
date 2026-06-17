# Explorer E2E — Infrastructure & Navigation Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **⚠️ GIT POLICY (user override):** This user FORBIDS the agent from running `git add`,
> `git commit`, or `git stash`. Every "Commit" step below shows the command for the **user to
> run manually**. At each commit checkpoint, STOP and ask the user to run it — never run it
> yourself.

**Goal:** Stand up a Playwright E2E suite for hathor-explorer (config, fixture, page objects,
conventions doc, anchors) and ship a navigation-smoke journey that asserts every main route
renders its identifying content with no global error, against real public mainnet backends.

**Architecture:** Playwright boots the explorer's own CRA dev server locally (`webServer`),
pointed at real public **mainnet** backends via `webServer.env` (OS env wins over the
committed `.env.local`). The app is read-only and stateless → `fullyParallel: true`. Tests
are TypeScript under their own scoped tsconfig, isolated from the JS app build. Three layers:
page objects (UI-decoupled, screen-scoped) → a page-scoped fixture → specs.

**Tech Stack:** Playwright Test (`@playwright/test`), TypeScript, Chromium. App under test:
React 18 / CRA (`react-app-rewired`).

---

## File Structure

| File | Responsibility |
|---|---|
| `playwright.e2e.config.ts` (repo root) | Playwright config: `webServer` (local explorer, mainnet env), `baseURL`, reporters, `fullyParallel`, screenshot/trace/video, desktop viewport. |
| `tests/e2e/tsconfig.json` | Scoped TS config for the suite. **Must NOT be at repo root** (a root `tsconfig.json` flips CRA into TypeScript mode and breaks `npm start`). |
| `tests/e2e/e2e.md` | Conventions doc — read before reading/writing any test. |
| `tests/e2e/support/anchors.ts` | Immutable on-chain anchors mirrored from `src/constants.js` (genesis ids, HTR uid). Unused by smoke; ready for future detail-page journeys. |
| `tests/e2e/pages/ExplorerApp.ts` | App-shell page object: navigate, assert no global error/blocked state, capture evidence screenshot. |
| `tests/e2e/pages/NavigationBar.ts` | Top-nav page object: brand/links present, network label, click a top-level link. |
| `tests/e2e/pages/routes.ts` | `SMOKE_ROUTES` registry: route → identifying locator. Parameterizes the smoke spec. |
| `tests/e2e/fixtures/explorer-fixture.ts` | Page-scoped fixture exposing `app` (ExplorerApp) + `nav` (NavigationBar). |
| `tests/e2e/navigation-smoke.spec.ts` | The v1 journey: per-route render check + screenshot, nav-click navigation, footer. |
| `package.json` | + devDeps (`@playwright/test`, `typescript`, `@types/node`) + scripts (`e2e`, `e2e:headed`, `e2e:ui`). |
| `.gitignore` | + `playwright-report/`, `test-results/`, `reports/screenshots/`. |

---

## Task 1: Tooling — install Playwright, scripts, gitignore

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Modify: `.gitignore`

- [ ] **Step 1: Install Playwright test + TypeScript dev deps**

Run:
```bash
npm install --save-dev @playwright/test@1.50.1 typescript@5.7.3 @types/node@22.13.1
```
Expected: installs without error; `package.json` `devDependencies` gains the three packages.
(Pin to these versions; adjust only if npm reports an incompatibility.)

- [ ] **Step 2: Install the Chromium browser binary**

Run:
```bash
npx playwright install chromium
```
Expected: downloads the Chromium build Playwright uses (prints "chromium ... downloaded").

- [ ] **Step 3: Add E2E npm scripts**

In `package.json`, add to `"scripts"` (after the existing `"format:check"` line):
```json
    "e2e": "playwright test --config playwright.e2e.config.ts",
    "e2e:headed": "playwright test --config playwright.e2e.config.ts --headed",
    "e2e:ui": "playwright test --config playwright.e2e.config.ts --ui",
```

- [ ] **Step 4: Update `.gitignore`**

Append to `.gitignore`:
```gitignore

# e2e (Playwright)
/playwright-report
/test-results
/reports/screenshots
```

- [ ] **Step 5: Verify CRA is still in JS mode (no root tsconfig was created)**

Run:
```bash
ls tsconfig.json 2>/dev/null && echo "ROOT TSCONFIG EXISTS - BAD" || echo "no root tsconfig - good"
```
Expected: `no root tsconfig - good`. If a root `tsconfig.json` exists, delete it — CRA would
otherwise switch to TypeScript mode and `npm start` would fail. (Our scoped config lives at
`tests/e2e/tsconfig.json`, created in Task 2.)

- [ ] **Step 6: Commit (user runs manually)**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore(e2e): add Playwright tooling, scripts and gitignore entries"
```

---

## Task 2: Scoped TypeScript config for the suite

**Files:**
- Create: `tests/e2e/tsconfig.json`

- [ ] **Step 1: Create `tests/e2e/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2021", "DOM"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "../../playwright.e2e.config.ts"]
}
```

- [ ] **Step 2: Verify it is NOT at repo root**

Run:
```bash
test -f tests/e2e/tsconfig.json && test ! -f tsconfig.json && echo OK || echo WRONG-LOCATION
```
Expected: `OK`.

- [ ] **Step 3: Commit (user runs manually)**

```bash
git add tests/e2e/tsconfig.json
git commit -m "chore(e2e): add scoped tsconfig for the Playwright suite"
```

---

## Task 3: Playwright config (webServer + mainnet env)

**Files:**
- Create: `playwright.e2e.config.ts`

- [ ] **Step 1: Create `playwright.e2e.config.ts`**

```ts
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
```

- [ ] **Step 2: Verify the config loads and lists zero tests (none written yet)**

Run:
```bash
npx playwright test --config playwright.e2e.config.ts --list
```
Expected: command exits cleanly reporting `Total: 0 tests in 0 files` (config parsed; no specs
yet). It must NOT error on the config itself.

- [ ] **Step 3: Commit (user runs manually)**

```bash
git add playwright.e2e.config.ts
git commit -m "chore(e2e): add Playwright config booting the explorer against mainnet"
```

---

## Task 4: Conventions doc + immutable anchors

**Files:**
- Create: `tests/e2e/e2e.md`
- Create: `tests/e2e/support/anchors.ts`

- [ ] **Step 1: Create `tests/e2e/e2e.md`**

```markdown
# Explorer E2E — Architecture & Conventions

**Read this before reading or writing any test in `tests/e2e/`.**

These tests drive the **real explorer UI** against **real public mainnet backends**
(`node.explorer.hathor.network` + `explorer-service.hathor.network`) with **real Unleash**
feature flags. Unlike the wallet, the explorer is **read-only**: no wallet, nothing to sign,
no extension, no per-test state. The suite is therefore simpler than the wallet's and runs
fully parallel.

## The rules that matter most

1. **Drive the real explorer against real public backends. Use real Unleash — never skip it.**
   The dev server runs WITHOUT `SKIP_FEATURE_TOGGLE`; flag-gated UI must resolve from the real
   proxy. Flags are per-network (`explorer-tokens-mainnet`, ...).
2. **Assert only what the UI actually renders — verify against the real component first.**
   Never assume a heading/value is present; read the screen's component (e.g. `src/screens/*`)
   or inspect the live DOM, then assert.
3. **Always wait past the version gate.** `App.js` shows `<Loading/>` until
   `versionApi.getVersion()` resolves, and `<VersionError/>` if the node version is too old.
   A per-route heading assertion (with a generous timeout) inherently waits past this.
4. **Page objects are decoupled and screen-scoped.** They expose intent-level verbs
   (`goto`, `expectLoaded`, `clickTopLink`), never raw selectors to the spec.
5. **Tests are independent and parallel** (read-only app, no shared state). Never rely on
   ordering or on another test's effect.
6. **Immutable chain data lives in `support/anchors.ts`**, mirroring `src/constants.js`.

## Layering

| Layer | File | Job |
|-------|------|-----|
| Page object | `pages/*.ts` | Granular UI steps for one screen/region. |
| Fixture | `fixtures/explorer-fixture.ts` | Exposes `app` (ExplorerApp) + `nav` (NavigationBar) on a fresh page. |
| Spec | `*.spec.ts` | The scenario: navigate + assert. |

## Global error / blocked states (what "no error" means)

- `VersionError`  → text "Please update you API version and try again"
- `ErrorMessage`  → text "Error loading."
- ChunkErrorBoundary → text "Failed to load this page"

## File map

```
tests/e2e/
  e2e.md                       # this file
  tsconfig.json                # scoped TS config (NOT at repo root)
  support/anchors.ts           # immutable on-chain anchors
  pages/
    ExplorerApp.ts             # app shell: goto, no-global-error, evidence screenshot
    NavigationBar.ts           # top nav: brand/links, network label, click link
    routes.ts                  # SMOKE_ROUTES registry (route -> identifying locator)
  fixtures/explorer-fixture.ts # app + nav fixtures
  navigation-smoke.spec.ts     # the v1 journey
```

> Config (`playwright.e2e.config.ts`) lives at the repo root.
```

- [ ] **Step 2: Create `tests/e2e/support/anchors.ts`**

```ts
/**
 * Immutable on-chain anchors, mirrored from `src/constants.js`. Deterministic detail-page
 * journeys (future iterations) reference these so specs never hardcode chain data. The
 * navigation-smoke journey does not use them yet — they are established here for reuse.
 */
export const MAINNET_GENESIS_BLOCK = [
  '000006cb93385b8b87a545a1cbb6197e6caff600c12cc12fc54250d39c8088fc',
] as const;

export const MAINNET_GENESIS_TX = [
  '0002d4d2a15def7604688e1878ab681142a7b155cbe52a6b4e031250ae96db0a',
  '0002ad8d1519daaddc8e1a37b14aac0b045129c01832281fb1c02d873c7abbf9',
] as const;

export const TESTNET_GENESIS_BLOCK = [
  '0000033139d08176d1051fb3a272c3610457f0c7f686afbe0afe3d37f966db85',
] as const;

export const TESTNET_GENESIS_TX = [
  '00e161a6b0bee1781ea9300680913fb76fd0fac4acab527cd9626cc1514abdc9',
  '00975897028ceb037307327c953f5e7ad4d3f42402d71bd3d11ecb63ac39f01a',
] as const;

/** Native token (HTR) uid used across the explorer. */
export const HTR_UID = '00';
```

- [ ] **Step 3: Commit (user runs manually)**

```bash
git add tests/e2e/e2e.md tests/e2e/support/anchors.ts
git commit -m "docs(e2e): add conventions doc and immutable on-chain anchors"
```

---

## Task 5: Page objects (ExplorerApp, NavigationBar, routes registry)

**Files:**
- Create: `tests/e2e/pages/ExplorerApp.ts`
- Create: `tests/e2e/pages/NavigationBar.ts`
- Create: `tests/e2e/pages/routes.ts`

- [ ] **Step 1: Create `tests/e2e/pages/ExplorerApp.ts`**

```ts
import { expect, type Page } from '@playwright/test';

/**
 * App-shell page object. Decoupled from any single screen: it navigates, asserts the absence
 * of the global error/blocked states, and captures evidence screenshots.
 */
export class ExplorerApp {
  constructor(private readonly page: Page) {}

  /** Navigate to a route (relative to baseURL). */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Assert none of the global blocked states are rendered:
   *  - VersionError (node version too old)
   *  - ErrorMessage (initial API load failed)
   *  - ChunkErrorBoundary fallback (lazy chunk failed to load)
   * Call this AFTER asserting a screen's identifying element, so the app has settled.
   */
  async expectNoGlobalError(): Promise<void> {
    await expect(
      this.page.getByText(/please update you api version and try again/i),
    ).toHaveCount(0);
    await expect(this.page.getByText(/^error loading\.$/i)).toHaveCount(0);
    await expect(this.page.getByText(/failed to load this page/i)).toHaveCount(0);
  }

  /**
   * Capture a full-page evidence screenshot (no baseline comparison — visual regression is a
   * future iteration). Playwright creates the parent dirs automatically.
   */
  async captureEvidence(name: string): Promise<void> {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }
}
```

- [ ] **Step 2: Create `tests/e2e/pages/NavigationBar.ts`**

```ts
import { expect, type Page } from '@playwright/test';

type TopLink = 'Home' | 'Network' | 'Statistics';

/**
 * Top navigation bar page object. The explorer always renders the "new UI" nav
 * (`Navigation.renderNewUi`). Home/Network/Statistics are direct NavLinks; Tokens/Tools/Nano
 * are Bootstrap dropdowns (not exercised by the smoke nav-click check).
 */
export class NavigationBar {
  constructor(private readonly page: Page) {}

  /** The nav is present once the brand logo link is visible. */
  async expectVisible(): Promise<void> {
    await expect(this.page.locator('nav a.navbar-brand')).toBeVisible();
  }

  /**
   * Assert the network label under the logo. Doubles as verification that the mainnet env
   * override took effect: the label is rendered straight from REACT_APP_NETWORK.
   */
  async expectNetwork(name: string): Promise<void> {
    await expect(this.page.locator('nav .nav-title')).toHaveText(name);
  }

  /** Click a top-level (non-dropdown) nav link by its visible text. */
  async clickTopLink(name: TopLink): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).click();
  }
}
```

- [ ] **Step 3: Create `tests/e2e/pages/routes.ts`**

```ts
import { type Locator, type Page } from '@playwright/test';

/**
 * A smoke route: its URL, a stable name (test title + screenshot filename), and the locator
 * for the element that uniquely identifies "this screen rendered". Identifiers are taken from
 * the real components in `src/screens/*` (verified) — prefer role/heading/text over structure.
 */
export interface RouteSpec {
  name: string;
  path: string;
  heading: (page: Page) => Locator;
}

export const SMOKE_ROUTES: RouteSpec[] = [
  // DashboardTx — src/screens/DashboardTx.js: <p class="title-page data-title">Live Data</p>
  { name: 'home', path: '/', heading: p => p.getByText(/^live data$/i) },
  // TransactionList — <h1 class="title-tx-page">Transactions</h1>
  {
    name: 'transactions',
    path: '/transactions',
    heading: p => p.getByRole('heading', { name: 'Transactions', exact: true }),
  },
  // BlockList — <h1 class="title-tx-page">Blocks</h1>
  {
    name: 'blocks',
    path: '/blocks',
    heading: p => p.getByRole('heading', { name: 'Blocks', exact: true }),
  },
  // TokenList — <p class="title-page">Tokens</p> (Unleash explorer-tokens-mainnet; ON in prod)
  {
    name: 'tokens',
    path: '/tokens',
    heading: p => p.locator('p.title-page', { hasText: /^Tokens$/ }),
  },
  // TokenBalances — <p class="title-page">Token Balance</p> (Unleash explorer-address-list-mainnet)
  {
    name: 'token-balances',
    path: '/token_balances',
    heading: p => p.locator('p.title-page', { hasText: /token balance/i }),
  },
  // Dashboard (statistics) — <h2 class="statistics-title">Statistics</h2>
  {
    name: 'statistics',
    path: '/statistics',
    heading: p => p.getByRole('heading', { name: 'Statistics', exact: true }),
  },
  // Dag — <h2 class="content-title">DAG</h2>
  { name: 'dag', path: '/dag', heading: p => p.getByRole('heading', { name: 'DAG', exact: true }) },
  // FeatureList — <Features title="Feature Activation" />
  {
    name: 'features',
    path: '/features',
    heading: p => p.getByText(/feature activation/i),
  },
  // PeerAdmin (network) — <h2 class="network-title">Network</h2>
  {
    name: 'network',
    path: '/network',
    heading: p => p.getByRole('heading', { name: 'Network', exact: true }),
  },
  // DecodeTx — <h2 class="title-page">Decode Transaction</h2>
  {
    name: 'decode-tx',
    path: '/decode-tx',
    heading: p => p.getByRole('heading', { name: /decode transaction/i }),
  },
  // PushTx — <h2 class="title-page">Push Transaction</h2>
  {
    name: 'push-tx',
    path: '/push-tx',
    heading: p => p.getByRole('heading', { name: /push transaction/i }),
  },
];
```

- [ ] **Step 4: Commit (user runs manually)**

```bash
git add tests/e2e/pages/ExplorerApp.ts tests/e2e/pages/NavigationBar.ts tests/e2e/pages/routes.ts
git commit -m "feat(e2e): add ExplorerApp/NavigationBar page objects and smoke route registry"
```

---

## Task 6: Fixture

**Files:**
- Create: `tests/e2e/fixtures/explorer-fixture.ts`

- [ ] **Step 1: Create `tests/e2e/fixtures/explorer-fixture.ts`**

```ts
import { test as base } from '@playwright/test';
import { ExplorerApp } from '../pages/ExplorerApp';
import { NavigationBar } from '../pages/NavigationBar';

type Fixtures = {
  app: ExplorerApp;
  nav: NavigationBar;
};

/**
 * Page-scoped fixtures: a fresh page per test (the app is read-only, so tests are independent
 * and parallel). Specs consume `{ app }` and/or `{ nav }`.
 */
export const test = base.extend<Fixtures>({
  app: async ({ page }, use) => {
    await use(new ExplorerApp(page));
  },
  nav: async ({ page }, use) => {
    await use(new NavigationBar(page));
  },
});

export const expect = test.expect;
```

- [ ] **Step 2: Commit (user runs manually)**

```bash
git add tests/e2e/fixtures/explorer-fixture.ts
git commit -m "feat(e2e): add page-scoped explorer fixture (app + nav)"
```

---

## Task 7: First smoke test — home route only (harness milestone)

This is the milestone that proves the whole harness end to end: dev server boots with the
mainnet env override, page objects resolve, and assertions run green against real backends.

**Files:**
- Create: `tests/e2e/navigation-smoke.spec.ts`

- [ ] **Step 1: Write the failing test (home only)**

Create `tests/e2e/navigation-smoke.spec.ts`:
```ts
import { test, expect } from './fixtures/explorer-fixture';
import { SMOKE_ROUTES } from './pages/routes';

test.describe('navigation smoke', () => {
  test('home renders and the app is on mainnet', async ({ app, nav, page }) => {
    const home = SMOKE_ROUTES.find(r => r.name === 'home')!;
    await app.goto(home.path);

    // Identifying element (waits past the version gate / initial Loading).
    await expect(home.heading(page)).toBeVisible();

    // Verifies the mainnet env override took effect (label rendered from REACT_APP_NETWORK).
    await nav.expectVisible();
    await nav.expectNetwork('mainnet');

    await app.expectNoGlobalError();
    await app.captureEvidence('home');
  });
});
```

- [ ] **Step 2: Run it — expect it to FAIL first for the right reason**

Run (the webServer boots the dev server automatically; first boot is slow):
```bash
npm run e2e -- navigation-smoke.spec.ts 2>&1 | tail -40
```
Expected: with the harness fully wired this PASSES on first authoring (for an E2E harness the
"red" state is the pre-Task-1 world where the command/config doesn't exist). If it FAILS,
read the failure:
- "Timed out waiting for ... live data" → the dev server didn't reach the home screen; check
  the webServer booted on :3002 and the mainnet override resolved (inspect the `list`
  reporter output / `playwright-report`).
- `.nav-title` not "mainnet" → the env override did NOT win over `.env.local`; confirm
  `webServer.env` is set and that no shell-exported REACT_APP_* contradicts it.

- [ ] **Step 3: Make it pass**

If Step 2 failed on the network label, the most likely cause is the env-precedence
assumption. Debug by temporarily logging the resolved base URL: open the running app and
check the Network tab targets `node.explorer.hathor.network` (not `localhost:8083`). If
`.env.local` is winning, set the same vars via a `cross-env`-style inline prefix is NOT
needed — instead ensure `webServer.env` is present (Playwright passes it as real process
env, which CRA's dotenv will not override). Re-run:
```bash
npm run e2e -- navigation-smoke.spec.ts
```
Expected: `1 passed`. A `reports/screenshots/home.png` is produced.

- [ ] **Step 4: Confirm the evidence screenshot exists**

Run:
```bash
ls -la reports/screenshots/home.png
```
Expected: the file exists and is non-empty (the home page, styled — proves CSS compiled).

- [ ] **Step 5: Commit (user runs manually)**

```bash
git add tests/e2e/navigation-smoke.spec.ts
git commit -m "test(e2e): add navigation smoke for the home route (harness milestone)"
```

---

## Task 8: Expand smoke to all routes (parameterized + per-route screenshots)

**Files:**
- Modify: `tests/e2e/navigation-smoke.spec.ts`

- [ ] **Step 1: Replace the spec body with the parameterized route loop**

Replace the entire contents of `tests/e2e/navigation-smoke.spec.ts` with:
```ts
import { test, expect } from './fixtures/explorer-fixture';
import { SMOKE_ROUTES } from './pages/routes';

test.describe('navigation smoke — every main route renders', () => {
  for (const route of SMOKE_ROUTES) {
    test(`${route.name} (${route.path}) renders with no global error`, async ({ app, page }) => {
      await app.goto(route.path);

      // Identifying element — waits past the version gate / initial Loading.
      await expect(route.heading(page)).toBeVisible();

      await app.expectNoGlobalError();
      await app.captureEvidence(route.name);
    });
  }

  test('app is on mainnet (env override took effect)', async ({ app, nav, page }) => {
    await app.goto('/');
    await expect(page.getByText(/^live data$/i)).toBeVisible();
    await nav.expectVisible();
    await nav.expectNetwork('mainnet');
  });
});
```

- [ ] **Step 2: Run the full route smoke**

Run:
```bash
npm run e2e -- navigation-smoke.spec.ts 2>&1 | tail -50
```
Expected: all route tests pass (`12 passed` — 11 routes + the mainnet check). Any route that
fails prints the exact missing locator; fix the locator in `pages/routes.ts` against the live
DOM (open `npx playwright show-report` to inspect the failure screenshot).

- [ ] **Step 3: Confirm one screenshot per route was captured**

Run:
```bash
ls reports/screenshots/ | sort
```
Expected: `blocks.png decode-tx.png dag.png features.png home.png network.png push-tx.png
statistics.png token-balances.png tokens.png transactions.png` (11 files).

- [ ] **Step 4: Commit (user runs manually)**

```bash
git add tests/e2e/navigation-smoke.spec.ts
git commit -m "test(e2e): cover all main routes in navigation smoke with per-route evidence"
```

---

## Task 9: Nav-bar click navigation + footer

**Files:**
- Modify: `tests/e2e/navigation-smoke.spec.ts`

- [ ] **Step 1: Append the nav-click + footer tests**

Add these two tests inside the `test.describe(...)` block in
`tests/e2e/navigation-smoke.spec.ts` (after the existing `mainnet` test):
```ts
  test('top-nav links navigate to their routes', async ({ app, nav, page }) => {
    await app.goto('/');
    await nav.expectVisible();

    await nav.clickTopLink('Network');
    await expect(page).toHaveURL(/\/network$/);
    await expect(page.getByRole('heading', { name: 'Network', exact: true })).toBeVisible();

    await nav.clickTopLink('Statistics');
    await expect(page).toHaveURL(/\/statistics$/);
    await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();

    await nav.clickTopLink('Home');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/^live data$/i)).toBeVisible();
  });

  test('footer is present', async ({ app, page }) => {
    await app.goto('/');
    await expect(page.getByText(/^live data$/i)).toBeVisible();
    await expect(
      page.getByText(/hathor network ©\s*\d{4}\s*all rights reserved/i),
    ).toBeVisible();
  });
```

- [ ] **Step 2: Run the full suite**

Run:
```bash
npm run e2e 2>&1 | tail -50
```
Expected: all tests pass (`14 passed` — 11 routes + mainnet + nav-click + footer). If the
nav-click test fails because Network/Statistics links are hidden, the viewport may be too
narrow — confirm `use.viewport` is `1366x900` in the config (Task 3).

- [ ] **Step 3: Commit (user runs manually)**

```bash
git add tests/e2e/navigation-smoke.spec.ts
git commit -m "test(e2e): add top-nav click navigation and footer presence checks"
```

---

## Task 10: Final verification & docs touch-up

**Files:**
- Modify: `CLAUDE.md` (explorer) — document the e2e commands (optional but recommended)

- [ ] **Step 1: Full clean run from scratch (no reused server)**

Run (kills any dev server first so the webServer boots fresh, exercising the env override):
```bash
pkill -f "react-app-rewired" 2>/dev/null; npm run e2e 2>&1 | tail -30
```
Expected: `14 passed`. This is the authoritative green run.

- [ ] **Step 2: Open the HTML report to eyeball the evidence**

Run:
```bash
npx playwright show-report
```
Expected: the report opens; every test green; screenshots viewable. Close it when done
(Ctrl-C).

- [ ] **Step 3: Document the e2e commands in the explorer CLAUDE.md**

In `/Users/rauloliveira/git/hathor/hathor-explorer/CLAUDE.md`, under the `### Testing`
section (after the `npm test` line), add:
```markdown

#### E2E (Playwright)
- `npm run e2e` - Run the E2E suite (boots the explorer against real mainnet backends)
- `npm run e2e:headed` - Run with a visible browser
- `npm run e2e:ui` - Open the Playwright UI runner
- Conventions: see `tests/e2e/e2e.md` (read before writing any E2E test)
```

- [ ] **Step 4: Commit (user runs manually)**

```bash
git add CLAUDE.md
git commit -m "docs(e2e): document Playwright e2e commands in explorer CLAUDE.md"
```

---

## Self-Review notes (for the implementer)

- **Selectors are grounded but live-verified.** Every identifier in `pages/routes.ts` and the
  global-error texts were read from the real components, but the live mainnet DOM is the final
  authority — if a heading assertion fails, inspect the failure screenshot in the HTML report
  and adjust the locator, don't loosen the assertion blindly (rule #2 in `e2e.md`).
- **Env precedence is the one real risk.** Task 7 Step 3 is the designated place to confirm
  `webServer.env` wins over `.env.local`. If CRA's dotenv ever changes precedence, the
  `nav.expectNetwork('mainnet')` assertion catches it immediately.
- **Flag-gated routes** (`/tokens`, `/token_balances`) are asserted as present because the
  mainnet flags are ON. If a flag is flipped off, the corresponding route test fails by design
  (a real signal). Finer tolerance is intentionally deferred (see the design's Future
  Iterations).
- **Counts:** Task 8 expects 12 passed (11 routes + mainnet); Task 9 brings it to 14
  (+nav-click +footer). Keep these in sync if routes are added/removed.
```
