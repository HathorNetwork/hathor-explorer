/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';
import { TX_COUNT } from '../constants';

const tokenApi = {
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

export default tokenApi;
