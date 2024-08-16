/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const addressApi = {
  getBalance(address) {
    return requestExplorerServiceV1
      .get(`node_api/address_balance`, { params: { address } })
      .then(res => {
        if (res && res.data) {
          return res.data;
        }
      })
      .catch(error => {
        // something wrong with request
      });
  },

  search(address, count, hash, page, token) {
    /*
     address: address to search
     count: int -> how many objects we want
     hash (optional): str -> hash reference for the pagination (works together with 'page' parameter)
     page (optional): 'previous' or 'next' -> if 'previous', we get the objects before the hash reference
                                   if 'next', we get the objects after the hash reference
     token (optional): str -> only fetch txs related to this token uid
    */

    const data = { address, count };
    if (hash) {
      data.hash = hash;
      data.page = page;
    }
    if (token) {
      data.token = token;
    }

    return requestExplorerServiceV1
      .get(`node_api/address_search`, { params: data })
      .then(res => {
        if (res && res.data) {
          return res.data;
        }
      })
      .catch(error => {
        // something wrong with request
      });
  },
};

export default addressApi;
