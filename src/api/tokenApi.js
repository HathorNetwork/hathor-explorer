/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { walletApi as libWalletApi } from '@hathor/wallet-lib';
import requestExplorerServiceV1 from './axiosInstance';
import helpers from '../utils/helpers';
import { TX_COUNT } from '../constants';

/**
 * Explorer Service implementation of token API
 * Used in full explorer mode
 */
const explorerTokenApi = {
  getList() {
    return requestExplorerServiceV1
      .get(`node_api/tokens`)
      .then(res => res.data)
      .catch(err => {
        throw new Error(err?.data?.message || err?.message || `Unknown error on get tokens list`);
      });
  },

  get(id) {
    const data = { id };
    return requestExplorerServiceV1
      .get(`node_api/token`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get token data for ${id}`
        );
      });
  },

  getHistory(id, timestamp, hash, page) {
    const data = { id, timestamp, hash, page, count: TX_COUNT };
    return requestExplorerServiceV1
      .get(`node_api/token_history`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get history for ${id}`
        );
      });
  },
};

/**
 * Adapter that routes to the correct implementation based on explorer mode
 * - Full mode: uses Explorer Service API (explorerTokenApi)
 * - Basic mode: uses wallet-lib API (libWalletApi)
 */
const tokenApi = {
  /**
   * Get list of all tokens
   * Note: Only available in full mode
   */
  getList() {
    if (!helpers.isExplorerModeFull()) {
      return Promise.reject(new Error('getList is only available in full explorer mode'));
    }
    return explorerTokenApi.getList();
  },

  /**
   * Get general token information
   *
   * @param {string} id Token uid
   */
  get(id) {
    if (helpers.isExplorerModeFull()) {
      return explorerTokenApi.get(id);
    }

    // Wallet-lib requires a resolve callback, wrap in promise
    return new Promise((resolve, reject) => {
      libWalletApi.getGeneralTokenInfo(id, data => resolve(data)).catch(err => reject(err));
    });
  },

  /**
   * Get token transaction history
   *
   * @param {string} id Token uid
   * @param {number} timestamp Timestamp of transaction as reference in pagination
   * @param {string} hash Hash of transaction as reference in pagination
   * @param {string} page The button clicked in the pagination ('previous' or 'next')
   */
  getHistory(id, timestamp, hash, page) {
    if (helpers.isExplorerModeFull()) {
      return explorerTokenApi.getHistory(id, timestamp, hash, page);
    }

    // Wallet-lib requires a resolve callback and count parameter, wrap in promise
    return new Promise((resolve, reject) => {
      libWalletApi
        .getTokenHistory(id, TX_COUNT, hash, timestamp, page, data => resolve(data))
        .catch(err => reject(err));
    });
  },
};

export default tokenApi;
