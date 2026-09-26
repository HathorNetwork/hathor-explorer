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

  /** Click a top-level (non-dropdown) nav link by its visible text.
   *  Scoped to the .nav-tabs-container to avoid matching the <Sidebar> (an <aside> nested
   *  inside <nav>) which also has the same links but is hidden on desktop viewports. */
  async clickTopLink(name: TopLink): Promise<void> {
    await this.page.locator('.nav-tabs-container').getByRole('link', { name, exact: true }).click();
  }
}
