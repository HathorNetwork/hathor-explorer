/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { txApi as libTxApi } from '@hathor/wallet-lib';
import requestExplorerServiceV1 from './axiosInstance';
import helpers from '../utils/helpers';

/**
 * Explorer Service implementation of transaction API
 * Used in full explorer mode
 */
const explorerTxApi = {
  getTransactions(type, count, timestamp, hash, page) {
    /*
     type: 'block' or 'tx' -> if we are getting txs or blocks
     count: int -> how many objects we want
     timestamp (optional): int -> timestamp reference for the pagination (works together with 'page' parameter)
     hash (optional): str -> hash reference for the pagination (works together with 'page' parameter)
     page (optional): 'previous' or 'next' -> if 'previous', we get the objects before the hash reference
                                   if 'next', we get the objects after the hash reference
    */
    const data = { type, count };
    if (hash) {
      data.hash = hash;
      data.timestamp = timestamp;
      data.page = page;
    }
    return requestExplorerServiceV1
      .get(`node_api/transactions`, { params: data })
      .then(res => {
        return res.data;
      })
      .catch(e => {
        throw new Error(e);
      });
  },

  getTransaction(id) {
    return requestExplorerServiceV1
      .get(`node_api/transaction`, { params: { id } })
      .then(res => {
        return libTxApi.schemas.transactionApi.parse(res.data);
      })
      .catch(e => {
        throw new Error(e);
      });
  },

  decodeTx(hex_tx) {
    const data = { hex_tx };
    return requestExplorerServiceV1.get(`node_api/decode_tx`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },

  pushTx(hex_tx, force) {
    const data = { hex_tx, force };
    return requestExplorerServiceV1.post(`node_api/push_tx`, data).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },

  getDashboardTx(block, tx) {
    const data = { block, tx };
    return requestExplorerServiceV1.get(`node_api/dashboard_tx`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },

  getConfirmationData(id) {
    const data = { id };
    return requestExplorerServiceV1
      .get(`node_api/transaction_acc_weight`, { params: data })
      .then(res => res.data);
  },
};

/**
 * Adapter that routes to the correct implementation based on explorer mode
 * - Full mode: uses Explorer Service API (explorerTxApi)
 * - Basic mode: uses wallet-lib API (libTxApi)
 */
const txApi = {
  /**
   * Get many transactions
   *
   * @param {string} type 'block' or 'tx' (if we are getting txs or blocks)
   * @param {number} count How many objects we want
   * @param {number} timestamp (optional) timestamp reference for the pagination
   * @param {string} hash (optional) hash reference for the pagination
   * @param {string} page (optional) 'previous' or 'next'
   */
  getTransactions(type, count, timestamp, hash, page) {
    if (helpers.isExplorerModeFull()) {
      return explorerTxApi.getTransactions(type, count, timestamp, hash, page);
    }

    // Wallet-lib requires a resolve callback, wrap in promise
    return new Promise((resolve, reject) => {
      libTxApi
        .getTransactions(type, count, timestamp, hash, page, data => {
          // Parse response if it's a string
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          resolve(parsedData);
        })
        .catch(err => reject(err));
    });
  },

  /**
   * Get one transaction
   *
   * @param {string} id Transaction ID to search
   */
  getTransaction(id) {
    if (helpers.isExplorerModeFull()) {
      return explorerTxApi.getTransaction(id);
    }

    // Wallet-lib requires a resolve callback, wrap in promise
    return new Promise((resolve, reject) => {
      libTxApi.getTransaction(id, data => resolve(data)).catch(err => reject(err));
    });
  },

  /**
   * Decode a transaction
   * Note: Only available in full mode
   *
   * @param {string} hex_tx Full transaction in hexadecimal
   */
  decodeTx(hex_tx) {
    if (!helpers.isExplorerModeFull()) {
      return Promise.reject(new Error('decodeTx is only available in full explorer mode'));
    }
    return explorerTxApi.decodeTx(hex_tx);
  },

  /**
   * Push a transaction
   * Note: Only available in full mode
   *
   * @param {string} hex_tx Full transaction in hexadecimal
   * @param {boolean} force Force push even if there are errors
   */
  pushTx(hex_tx, force) {
    if (!helpers.isExplorerModeFull()) {
      return Promise.reject(new Error('pushTx is only available in full explorer mode'));
    }
    return explorerTxApi.pushTx(hex_tx, force);
  },

  /**
   * Get dashboard data
   *
   * @param {number} block Quantity of blocks to return
   * @param {number} tx Quantity of transactions to return
   */
  getDashboardTx(block, tx) {
    if (helpers.isExplorerModeFull()) {
      return explorerTxApi.getDashboardTx(block, tx);
    }

    // Wallet-lib requires a resolve callback, wrap in promise
    return new Promise((resolve, reject) => {
      libTxApi.getDashboardTx(block, tx, data => resolve(data)).catch(err => reject(err));
    });
  },

  /**
   * Get confirmation data of a transaction
   *
   * @param {string} id Transaction hash in hex
   */
  getConfirmationData(id) {
    if (helpers.isExplorerModeFull()) {
      return explorerTxApi.getConfirmationData(id);
    }

    // Wallet-lib requires a resolve callback, wrap in promise
    return new Promise((resolve, reject) => {
      libTxApi.getConfirmationData(id, data => resolve(data)).catch(err => reject(err));
    });
  },
};

export default txApi;
