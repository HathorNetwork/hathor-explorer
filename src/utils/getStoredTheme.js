/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Retrieves the current theme from localStorage or the system preference.
 *
 * @returns {string} The current theme, either 'dark' or 'light'.
 */
const getStoredTheme = () => {
  return localStorage.getItem('theme');
};

export default getStoredTheme;
