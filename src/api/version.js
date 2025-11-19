/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { versionApi as libVersionApi } from '@hathor/wallet-lib';
import requestExplorerServiceV1 from './axiosInstance';
import helpers from '../utils/helpers';

/**
 * Explorer Service implementation of version API
 * Used in full explorer mode
 */
const explorerVersionApi = {
  getVersion() {
    return requestExplorerServiceV1
      .get(`node_api/version`)
      .then(res => res.data)
      .catch(err => {
        throw new Error(err?.data?.message || err?.message || `Unknown error on get node version`);
      });
  },
};

/**
 * Adapter that routes to the correct implementation based on explorer mode
 * - Full mode: uses Explorer Service API (explorerVersionApi)
 * - Basic mode: uses wallet-lib API (libVersionApi)
 */
const versionApi = {
  /**
   * Get version of full node running in connected server
   */
  getVersion() {
    return helpers.isExplorerModeFull()
      ? explorerVersionApi.getVersion()
      : libVersionApi.asyncGetVersion();
  },
};

export default versionApi;
