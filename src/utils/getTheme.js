/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const getTheme = () => {
  const html = document.querySelector('html');

  if (localStorage.getItem('theme')) {
    html.dataset.theme = `theme-${localStorage.getItem('theme')}`;
    return localStorage.getItem('theme');
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.dataset.theme = `theme-dark`;
    localStorage.setItem('theme', 'dark');
    return 'dark';
  }

  localStorage.setItem('theme', 'light');
  html.dataset.theme = `theme-light`;
  return 'light';
};

export default getTheme;
