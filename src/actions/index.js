/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import store from '../store/index';

export const dashboardUpdate = data => ({ type: 'dashboard_update', payload: data });

export const isVersionAllowedUpdate = data => ({
  type: 'is_version_allowed_update',
  payload: data,
});

export const apiLoadErrorUpdate = data => ({ type: 'api_load_error_update', payload: data });

export const updateServerInfo = data => ({ type: 'update_server_info', payload: data });

export const toggleTheme = () => {
  const state = store.getState();
  const html = document.querySelector('html');
  const themeNow = state.theme === 'light' ? 'dark' : 'light';
  html.dataset.theme = `theme-${themeNow}`;
  localStorage.setItem('theme', `${themeNow}`);

  return { type: 'toggle_theme', payload: themeNow };
};
