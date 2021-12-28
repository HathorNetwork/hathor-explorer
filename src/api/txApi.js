/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const txApi = {
  getTransactions(type, count, timestamp, hash, page) {
    /*
     type: 'block' or 'tx' -> if we are getting txs or blocks
     count: int -> how many objects we want
     timestamp (optional): int -> timestamp reference for the pagination (works together with 'page' parameter)
     hash (optional): str -> hash reference for the pagination (works together with 'page' parameter)
     page (optional): 'previous' or 'next' -> if 'previous', we get the objects before the hash reference
                                   if 'next', we get the objects after the hash reference
    */
    const data = {type, count};
    if (hash) {
      data['hash'] = hash;
      data['timestamp'] = timestamp;
      data['page'] = page;
    }
    return requestExplorerServiceV1.get(`node_api/transactions`, {params: data}).then(res => {
      return res.data
    }).catch(e => {
      throw new Error(e);
    });
  },

  getTransaction(id) {
    return requestExplorerServiceV1.get(`node_api/transaction`, {params: {id}}).then(res => {
      return res.data
    }).catch(e => {
      throw new Error(e);
    });
  },

  decodeTx(hex_tx) {
    const data = {hex_tx}
    return requestExplorerServiceV1.get(`node_api/decode_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  pushTx(hex_tx, force) {
    const data = {hex_tx, force}
    return requestExplorerServiceV1.get(`node_api/push_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getDashboardTx(block, tx) {
    const data = {block, tx}
    return requestExplorerServiceV1.get(`node_api/dashboard_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  /*
   * Call api to get confirmation data of a tx
   *
   * @params {string} id Transaction hash in hex
   *
   * @return {Promise}
   * @memberof TransactionApi
   * @inner
   */
  getConfirmationData(id) {
    const data = {id};
    return requestExplorerServiceV1.get(`node_api/transaction_acc_weight`, {params: data}).then((res) => {
      return res.data;
    }, (res) => {
      return Promise.reject(res);
    });
  },
};

export default txApi;
