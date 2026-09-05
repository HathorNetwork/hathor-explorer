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

## Backends & CORS (why the browser launches with `--disable-web-security`)

The real backends (`node.explorer.hathor.network`, `explorer-service.hathor.network`) only
send `Access-Control-Allow-Origin: https://explorer.hathor.network`. Running the app from
`http://localhost:3002`, the browser blocks every API call, so `versionApi.getVersion()` fails
and the app renders the `ErrorMessage` ("Error loading.") gate instead of any screen.

To make the real-backend smoke work from localhost, the Playwright config launches Chromium
with `--disable-web-security` (in `playwright.e2e.config.ts` → `use.launchOptions`). This is
scoped to the test browser only — it touches nothing in the app. It is a deliberate, known
E2E tradeoff (it disables the same-origin policy wholesale). Cleaner alternatives exist and
are recorded in the design doc's risks section (origin remap à la hathor-rpc-lib, or a dev
proxy); they were deferred for v1.

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
