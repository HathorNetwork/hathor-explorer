/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class PaginationURL {
  /**
   * parameters {Object} Object of parameters to the URL {param1: {required: true}, param2: {required: false}}
   * XXX Could be used in the future to do extra validations, e.g. param type.
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
    for (const param in this.parameters) {
      if (this.parameters[param].required || params.get(param) !== null) {
        ret[param] = params.get(param);
      }
    }
    return ret;
  }

  /**
   * Delete optional query params from URL
   */
  clearOptionalQueryParams() {
    const url = new URL(window.location.href);
    for (const param in this.parameters) {
      if (!this.parameters[param].required) {
        // Remove from search param
        url.searchParams.delete(param);
      }
    }
    window.history.replaceState({}, '', url.href);
  }

  /**
   * Clear parameters from the URL without refreshing the window
   *
   * paramsToClear {string[]} Array of strings with keys to clear the URL parameters
   */
  clearParametersWithoutRefresh(paramsToClear) {
    const url = new URL(window.location.href);
    for (const param in this.parameters) {
      if (paramsToClear.indexOf(param) !== -1) {
        // Remove from search param
        url.searchParams.delete(param);
      }
    }
    window.history.replaceState({}, '', url.href);
  }

  /**
   * Set URL parameters
   *
   * data {Object} with key as param name and value as it's value to be set
   * paramsToClear {string[]=[]} Array of strings with keys to clear the URL parameters
   */
  setURLParameters(data, paramsToDelete = []) {
    const url = new URL(window.location.href);
    for (const param in data) {
      if (param in this.parameters) {
        url.searchParams.set(param, data[param]);
      }
    }

    for (const param of paramsToDelete) {
      if (!url.searchParams.has(param)) {
        // Param does not exist in URL
        continue;
      }

      // Remove from search param
      url.searchParams.delete(param);
    }

    return url.pathname + url.search + url.hash;
  }
}

export default PaginationURL;
