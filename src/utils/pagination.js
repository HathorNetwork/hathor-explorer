/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class PaginationURL {
  /**
   * parameters {Array} Array of strings with pagination URL parameters
   */
  constructor(parameters) {
    this.parameters = parameters;
  }

  /**
   * Get query params from URL
   */
  obtainQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const ret = {};
    for (const param of this.parameters) {
      ret[param] = params.get(param);
    }
    return ret;
  }

  /**
   * Delete query params from URL
   */
  clearQueryParams() {
    const url = new URL(window.location.href);
    for (const param of this.parameters) {
      url.searchParams.delete(param);
    }
    window.history.replaceState({}, '', url.href);
  }

  /**
   * Set URL parameters
   *
   * data {Object} with key as param name and value as it's value to be set
   */
  paginationUrl(data) {
    const url = new URL(window.location.href);
    for (const param of this.parameters) {
      url.searchParams.set(param, data[param]);
    }
    return url.pathname + url.search + url.hash;
  }
}

export default PaginationURL;
