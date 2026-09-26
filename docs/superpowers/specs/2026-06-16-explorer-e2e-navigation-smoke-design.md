# Explorer E2E — Infrastructure & Navigation Smoke Design

**Date:** 2026-06-16
**Status:** Approved (pending implementation plan)
**Area:** `hathor-explorer` — new Playwright E2E suite driving the real explorer UI against
real public backends.

## Context

The explorer has **no E2E tests** today (no Playwright, no `tests/e2e/`, only the unused CRA
`react-app-rewired test` harness). We want to introduce an E2E suite modeled on the
`hathor-rpc-lib-e2e` worktree's Playwright architecture — its layering, its
conventions doc, its spec-driven discipline — adapted to the explorer.

The crucial difference: the rpc-lib suite drives a **wallet** through the **real MetaMask
Flask extension + the Hathor Snap**, which forces an entire `driver/` layer, a provisioning
layer, seed config, a single-worker persistent context, and the "approve/reject the Snap in
the spec" discipline. **The explorer has none of that.** It is a **read-only block explorer**:
every screen just fetches from a fullnode API and the explorer-service backend and renders.
There is no wallet, nothing to sign, no extension, no per-test state. That removes most of
the rpc-lib machinery and lets the explorer suite be simpler and fully parallel.

## Goals

- Stand up the full E2E **infrastructure** (Playwright config, fixture, page-object layer,
  conventions doc, immutable test anchors, npm scripts) so adding future journeys is cheap.
- Ship one **navigation smoke** journey that proves the harness end to end: every main route
  renders its identifying content with no global error state.
- Drive the **real** explorer against **real public mainnet backends** with **real Unleash**
  feature flags (never `SKIP_FEATURE_TOGGLE`).
- Keep the suite isolated from the app build (`src/` stays JS/airbnb; tests are TypeScript
  under their own tsconfig).

## Non-Goals (deferred to later iterations)

- Genesis detail pages (deterministic tx/block detail via immutable anchors).
- List pages + pagination + click-through (TransactionList, BlockList).
- Search, Token (list/detail/balances), and Address detail journeys.
- Tools (decode-tx, push-tx) functional flows, nano contracts / blueprints.
- A CI workflow (GitHub Actions). Intentionally out of v1; planned as a later iteration.
- Visual/screenshot regression (`toHaveScreenshot`). Intentionally out of v1; planned as a
  later iteration. It is **not** a fit for this smoke suite ("renders without error"), and it
  fights the live-mainnet data source: real pages have non-deterministic content (live
  metrics, latest tx/block lists, rising block height), so a future visual-regression
  iteration must target deterministic surfaces only — immutable anchors (genesis tx/block
  detail) and/or the static chrome (nav, footer, layout) with dynamic regions masked
  (`mask: [...]`). It also needs platform-stable baselines (goldens generated in the official
  Playwright Docker image, since rendering differs per OS). See "Future iterations" below.

## Key decisions (confirmed)

| Decision | Choice | Rationale |
|---|---|---|
| Data source | **Real public backends** (app under test runs locally) | Most faithful translation of rpc-lib (local app + real network + real Unleash). Zero blockchain infra. |
| Network | **Mainnet** | Production deployment: most stable, most data, genesis well-known, feature flags ON → fullest route coverage. |
| Test language | **TypeScript** | Typed page objects, matches rpc-lib; Playwright runs TS natively; scoped tsconfig keeps it off the app build. |
| Parallelism | **`fullyParallel: true`** | No extension → no persistent context → read-only, stateless app → every test independent. (rpc-lib's `workers: 1` constraint does not apply.) |
| CI | **Deferred** | v1 ships local infra + spec only. |
| First journey | **Navigation smoke only** | Validates the whole harness at lowest cost. |

## How the explorer gets its data (verified in source)

- `BASE_URL` (`src/constants.js`) — fullnode API, default
  `https://node.explorer.hathor.network/v1a/`. Used for version, tx/block detail, DAG.
- `EXPLORER_SERVICE_BASE_URL` — explorer-service backend, default
  `https://explorer-service.hathor.network/`. Backs token list, address detail, token
  balances (Elasticsearch-fed).
- `WS_URL` — websocket for the home dashboard's live metrics.
- `UNLEASH_CONFIG` — real Unleash proxy; flags are **per-network**
  (`explorer-tokens-${network}`, `explorer-new-ui-enabled-${network}`, ...).
- `App.js` runs a **version gate** on mount: it calls `versionApi.getVersion()`, and until it
  resolves the app renders only `<Loading/>` (or `<ErrorMessage/>` on failure). If the node
  version is below `MIN_API_VERSION` it renders `<VersionError/>` instead of the app. Every
  smoke assertion must wait past this gate.
- `EXPLORER_MODE` (`full` by default) gates a set of routes (`/tokens`, `/token_balances`,
  `/dag`, `/features`, `/network`, `/statistics`, `/address/:address`, `/push-tx`,
  `/decode-tx`) behind `helpers.isExplorerModeFull()`. v1 runs in full mode.

## Architecture

Three roles. Each has one job. (Compare rpc-lib's four roles — the explorer drops the
MetaMask **driver** and the **provisioning** layers entirely.)

| Layer | File(s) | Job | Called by |
|---|---|---|---|
| **Page object** | `tests/e2e/pages/*.ts` | Granular UI steps for one screen/region: navigate to a route, read a heading, click a nav link, assert the screen's identifying element, assert no error state. | Specs (and the fixture) |
| **Fixture** | `tests/e2e/fixtures/explorer-fixture.ts` | Hands the spec an app that has **passed the version gate** (app shell rendered, not `Loading`/`VersionError`) plus instantiated page objects. Page-scoped (fresh page per test). | Playwright runner |
| **Spec** | `tests/e2e/*.spec.ts` | The scenario: navigate + assert. v1 = `navigation-smoke.spec.ts`. | Playwright runner |
| **Anchors** | `tests/e2e/support/anchors.ts` | Immutable test data mirroring `src/constants.js` (genesis tx/block ids per network, known token UIDs) so specs never hardcode chain data. Unused by the smoke spec but established now for the next iterations. | Specs |
| **Conventions** | `tests/e2e/e2e.md` | The rules. Read before reading/writing any test. | Humans |
| **Config** | `playwright.e2e.config.ts` (repo root) | `webServer` boots the local explorer; `baseURL`, reporters, timeouts. | Playwright runner |

### Page object boundaries

Mirror rpc-lib's "page object is decoupled, asserts only verified UI" rule:

- A page object knows **one screen** (or one shared region like the nav bar). It exposes
  intent-level verbs (`goto()`, `expectLoaded()`, `clickNavLink(name)`), never raw selectors
  to the spec.
- It asserts **only what the real component renders** — verified by reading the component
  and/or inspecting the live DOM during implementation, never assumed.
- Initial set for v1:
  - `ExplorerApp.ts` — app shell: wait past the version gate; assert no global error
    (`ErrorMessage`, `VersionError`, ChunkErrorBoundary fallback).
  - `NavigationBar.ts` — the top nav: click a named link, assert the active route.
  - `HomePage.ts` — the `/` dashboard (DashboardTx): its identifying element.
  - One thin `RouteScreen` helper (or per-route assertions) covering the remaining smoke
    routes by their identifying heading/region. (Whether these become individual page-object
    classes or one parameterized helper is an implementation detail; the smoke spec only needs
    "this route rendered its content, no error".)

## Environment wiring (the one integration subtlety)

The local dev server must point at **public mainnet backends**, overriding the committed
`.env.local` (which points at the localnet docker, `localhost:8083`). Playwright's
`webServer.env` sets OS-level env for the spawned process; CRA's dotenv loader **does not
override variables already present in `process.env`**, so OS env wins over `.env.local`.
That is the mechanism we rely on.

```
// playwright.e2e.config.ts (sketch)
webServer: {
  // `npm start` (not `start-js`) so the SCSS is compiled+watched alongside the dev server —
  // `start-js` alone skips CSS, which can make styled elements read as hidden in Playwright.
  command: 'npm start',
  url: 'http://localhost:3002',
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
  env: {
    BROWSER: 'none',                 // don't auto-open a browser tab
    PORT: '3002',
    REACT_APP_BASE_URL: 'https://node.explorer.hathor.network/v1a/',
    REACT_APP_EXPLORER_SERVICE_BASE_URL: 'https://explorer-service.hathor.network/',
    REACT_APP_WS_URL: 'wss://node.explorer.hathor.network/v1a/ws/',
    REACT_APP_NETWORK: 'mainnet',
    REACT_APP_EXPLORER_MODE: 'full',
    // no SKIP_FEATURE_TOGGLE -> real Unleash
  },
},
use: {
  baseURL: 'http://localhost:3002',
  trace: 'on-first-retry',
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',   // failure evidence, embedded in the HTML report
},
fullyParallel: true,
timeout: 60_000,
expect: { timeout: 20_000 },
reporter: [['html', { open: 'never' }], ['list']],
```

**Implementation must verify** the env override actually takes effect (e.g. assert the app
loaded mainnet data, or log the resolved `BASE_URL`) before trusting the suite — this is the
one place the CRA/dotenv precedence assumption could bite.

## Navigation smoke spec (v1 content)

`navigation-smoke.spec.ts`, fully parallel. For each route below: navigate, wait past the
version gate, assert the screen's identifying element is visible, and assert **no** global
error state. Plus nav-bar navigation and footer presence.

Routes (full mode, mainnet): `/` (home dashboard), `/transactions`, `/blocks`, `/tokens`,
`/token_balances`, `/statistics`, `/dag`, `/features`, `/network`, `/decode-tx`, `/push-tx`.

- Unleash-gated screens (`/tokens`, `/token_balances`, ...) follow the rpc-lib rule: **wait
  for the flag-gated UI** (toggles re-fetch async). On mainnet these flags are ON; if a flag
  is unexpectedly off, the assertion is written to tolerate absence rather than hang.
- Identifying elements are taken from the **real components** (verified during
  implementation). Prefer role/heading/text selectors over structural ones, matching the
  rpc-lib selector discipline.
- "No global error" = none of `ErrorMessage`, `VersionError`, the ChunkErrorBoundary
  fallback ("Failed to load this page"), and the page is not stuck on `Loading`.

### Screenshot evidence (v1)

Two layers, no visual comparison (regression is a future iteration):

- **On failure** — `screenshot: 'only-on-failure'` in the config `use` (above), so a failing
  route attaches a PNG to the HTML report automatically.
- **Per route, always** — after asserting a route rendered, the spec captures an intentional
  artifact: `await page.screenshot({ path: 'reports/screenshots/<route>.png', fullPage: true })`.
  These are evidence/inspection artifacts only — never diffed against a baseline. Output dir
  (`reports/screenshots/`) is gitignored.

## New UI vs old UI

`explorer-new-ui-enabled-mainnet` (real Unleash) decides which UI renders. The suite asserts
against **whatever the real flag resolves to** — consistent with "use real Unleash, never
skip it." Implementation inspects the live DOM (Playwright snapshot) to write selectors
against the UI that actually renders; if both UIs must be supported later, selectors will be
chosen to match either, but v1 targets the real rendered UI only.

## Conventions doc (`tests/e2e/e2e.md`)

A trimmed analog of rpc-lib's `e2e.md`, encoding the explorer's rules:

1. Drive the real explorer against real public backends; use real Unleash, never skip it.
2. Assert only what the UI renders — verify against the real component first.
3. Always wait past the version gate before asserting any screen content.
4. Page objects are decoupled and screen-scoped; specs compose them.
5. Tests are independent and parallel (read-only app, no shared state) — never rely on
   ordering or on another test's effect.
6. Immutable chain data lives in `support/anchors.ts`, mirroring `src/constants.js`.

## Deliverables (v1)

- `playwright.e2e.config.ts` (repo root) — webServer + baseURL + reporters + `fullyParallel`.
- `tests/e2e/e2e.md` — conventions.
- `tests/e2e/fixtures/explorer-fixture.ts` — version-gate-aware fixture + page objects.
- `tests/e2e/pages/ExplorerApp.ts`, `NavigationBar.ts`, `HomePage.ts` (+ route assertions).
- `tests/e2e/support/anchors.ts` — immutable anchors (mirrors `src/constants.js`).
- `tests/e2e/navigation-smoke.spec.ts` — the v1 journey.
- `tests/e2e/tsconfig.json` — scoped TS config for the suite.
- `package.json` — devDeps (`@playwright/test`, `typescript`, `@types/node`) + scripts
  (`e2e`, `e2e:headed`, `e2e:ui`).
- `.gitignore` — `playwright-report/`, `test-results/`, `reports/screenshots/`.

## Growth model

- **New journey** = +1 spec + the page object(s) it needs. No new infra.
- **New screen** = +1 page object reused across specs.
- Deterministic detail-page journeys consume `support/anchors.ts`; list journeys assert
  structurally; both reuse the same fixture and config.

## Future iterations (explicit to-go list)

Deferred from v1 on purpose; each reuses the v1 infrastructure (config, fixture, page
objects, anchors) with no new harness work:

1. **Genesis detail pages** — deterministic tx/block detail via the immutable anchors.
2. **List pages + pagination** — TransactionList, BlockList: rows render, prev/next paging,
   click-through to a detail page.
3. **Search + Token/Address** — search by id/address; TokenList, TokenDetail, TokenBalances,
   AddressDetail (Unleash-gated screens).
4. **CI workflow (GitHub Actions)** — run the suite on PRs (`npm ci` → `npx playwright install
   --with-deps chromium` → `npm run e2e`), uploading the HTML report / traces as artifacts.
5. **Visual regression (`toHaveScreenshot`)** — its **own** iteration, not bolted onto smoke.
   Targets deterministic surfaces only (genesis detail, or static chrome with dynamic regions
   masked), with platform-stable baselines generated in the official Playwright Docker image.
   See the Non-Goals note for why it is unfit for the live-data smoke suite.

## Risks / open details

- **CRA/dotenv precedence**: the env override via `webServer.env` is standard dotenv
  behavior but must be verified in implementation (see Environment wiring). **Verified during
  implementation** — the `mainnet` nav label confirms the override wins over `.env.local`.
- **Cross-origin backends / CORS** (discovered during implementation): the real backends only
  allow `Access-Control-Allow-Origin: https://explorer.hathor.network`, so API calls from
  `http://localhost:3002` are blocked and the app falls into the `ErrorMessage` gate. **v1
  decision (user-approved):** launch Chromium with `--disable-web-security` (scoped to the
  test browser, `use.launchOptions` — touches nothing in the app). Tradeoff: disables the
  same-origin policy wholesale (a known E2E smell). **Cleaner alternatives, deferred:**
  (1) origin remap à la hathor-rpc-lib — `baseURL = https://explorer.hathor.network` + HTTPS
  dev server + `--host-resolver-rules=MAP explorer.hathor.network:443 127.0.0.1:3002`, so the
  browser legitimately sits on the allowed origin with no security disabled; (2) a CRA dev
  proxy (`setupProxy.js`) making API calls same-origin. Revisit if v1's flag becomes a problem
  (e.g. when wiring CI).
- **Public backend availability/latency**: real mainnet backends can be slow or briefly
  unavailable; timeouts are generous and `trace`/`video` capture failures. Flakiness from
  the live network is an accepted tradeoff of the "real backends" decision.
- **Unleash flag drift**: a flag flipping off on mainnet could change which routes render;
  smoke assertions for gated routes tolerate absence to avoid false failures.
- **Spec doc commit**: per the user's git policy, this document is written but **not
  committed** by the assistant; the user commits manually.
