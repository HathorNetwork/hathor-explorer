/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import hathorLib from '@hathor/wallet-lib';

/**
 * Create axios instance to be used in lib HTTP requests
 *
 * @module Axios
 */

/**
 * Create an axios instance to be used when sending requests
 *
 * @param {callback} resolve Callback to be stored and used in case of a retry after a fail
 */
const createRequestInstance = resolve => {
  // Will override lib axios instance increasing the default request timeout
  const instance = hathorLib.axios.defaultCreateRequestInstance(resolve, 30000);
  return instance;
};

export default createRequestInstance;
