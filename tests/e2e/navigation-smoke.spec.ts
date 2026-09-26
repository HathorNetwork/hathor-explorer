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
});
