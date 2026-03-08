/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const themeUtils = {
  /**
   * Retrieves the current theme from localStorage or the system preference.
   *
   * @returns {string} The current theme, either 'dark' or 'light'.
   */
  getStoredTheme() {
    return localStorage.getItem('theme');
  },

  /**
   * Determines the system's preferred color scheme.
   *
   * @returns {string} The system's preferred theme, either 'dark' or 'light'.
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  /**
   * Applies the given theme to the HTML element and stores it in localStorage.
   *
   * @param {string} theme - The theme to be applied, either 'dark' or 'light'.
   */
  applyTheme(theme) {
    const html = document.querySelector('html');
    html.dataset.theme = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  },

  /**
   * Gets and applies the appropriate theme, prioritizing the user's stored preference.
   *
   * @returns {string} The theme that was applied, either 'dark' or 'light'.
   */
  initializeTheme() {
    const storedTheme = this.getStoredTheme();

    if (storedTheme) {
      this.applyTheme(storedTheme);
      return storedTheme;
    }

    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    return systemTheme;
  },
};

export default themeUtils;
