/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const addressApi = {
  getTokens(address, limit, offset) {
    /*
     address: address to search tokens on
     limit (optional): int -> how many objects we want
     offset (optional): int -> offset this many transactions before fetching
    */

    const data = { address };
    if (limit) {
      data.limit = limit;
    }
    if (offset) {
      data.offset = offset;
    }

    return requestExplorerServiceV1.get(`address/tokens`, { params: data }).then(res => {
      if (res && res.data) {
        return res.data;
      }
      return undefined;
    });
  },

  getBalance(address, token) {
    return requestExplorerServiceV1
      .get(`address/balance`, { params: { address, token } })
      .then(res => {
        if (res && res.data) {
          return res.data;
        }
        return undefined;
      });
  },

  getHistory(address, token, limit, lastTx, lastTs) {
    /*
     address: address to search
     token: str -> only fetch txs related to this token uid
     limit (optional): int -> how many objects we want
     lastTx (optional): str -> last tx of the page, so we can retrieve the next page
     lastTs (optional): int -> last timestamp of the page, so we can retrieve the next page
    */

    const data = { address, token };
    if (limit) {
      data.limit = limit;
    }

    if (lastTx) {
      data.last_tx = lastTx;
    }

    if (lastTs) {
      data.last_ts = lastTs;
    }

    return requestExplorerServiceV1.get(`address/history`, { params: data }).then(res => {
      if (res && res.data) {
        return res.data;
      }
      return undefined;
    });
  },
};

export default addressApi;
