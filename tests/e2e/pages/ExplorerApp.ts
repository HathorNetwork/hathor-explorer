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
