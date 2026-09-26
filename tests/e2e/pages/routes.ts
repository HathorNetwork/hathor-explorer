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
