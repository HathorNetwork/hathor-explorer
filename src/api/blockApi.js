/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import helpers from '../utils/helpers';

import requestExplorerServiceV1 from './axiosInstance';

const BLOCK_API_DEFAULT_TIMEOUT = 35000; // ms

const blockApi = {
  /**
   * Get the best chain height available on ElasticSearch
   *
   * @returns {Promise}
   */
  async getBestChainHeight() {
    const response = await requestExplorerServiceV1.get('blocks/best_chain_height', {
      timeout: BLOCK_API_DEFAULT_TIMEOUT,
    });
    return helpers.handleExplorerServiceResponse(response);
  },
};

export default blockApi;
