/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import applyTheme from './applyTheme';
import getStoredTheme from './getStoredTheme';
import getSystemTheme from './getSystemTheme';

/**
 * Gets and applies the appropriate theme, prioritizing the user's stored preference.
 *
 * @returns {string} The theme that was applied, either 'dark' or 'light'.
 */
const initializeTheme = () => {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    applyTheme(storedTheme);
    return storedTheme;
  }

  const systemTheme = getSystemTheme();
  applyTheme(systemTheme);
  return systemTheme;
};

export default initializeTheme;
