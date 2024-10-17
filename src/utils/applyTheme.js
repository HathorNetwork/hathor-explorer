/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Applies the given theme to the HTML element and stores it in localStorage.
 *
 * @param {string} theme - The theme to be applied, either 'dark' or 'light'.
 */
const applyTheme = theme => {
  const html = document.querySelector('html');
  html.dataset.theme = `theme-${theme}`;
  localStorage.setItem('theme', theme);
};

export default applyTheme;
