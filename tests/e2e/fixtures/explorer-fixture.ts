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
