/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const addressApi = {
  getTokens(address) {
    return requestExplorerServiceV1.get(`address/tokens`, {params: {address}}).then((res) => {
      if (res && res.data) {
        return res.data
      }
    }).catch((error) => {
      // something wrong with request
    });
  },

  getBalance(address, token) {
    return requestExplorerServiceV1.get(`address/balance`, {params: {address, token}}).then((res) => {
      if (res && res.data) {
        return res.data
      }
    }).catch((error) => {
      // something wrong with request
    });
  },

  getHistory(address, token, count, skip) {
    /*
     address: address to search
     token: str -> only fetch txs related to this token uid
     count (optional): int -> how many objects we want
     skip (optional): str -> skip this many transactions before fetching
    */

    const data = {address, token};
    if (count) {
        data['count'] = count;
    }
    if (skip) {
        data['skip'] = skip;
    }

    return requestExplorerServiceV1.get(`address/history`, {params: data}).then((res) => {
      if (res && res.data) {
        return res.data
      }
    }).catch((error) => {
      // something wrong with request
    });
  },
};

export default addressApi;
