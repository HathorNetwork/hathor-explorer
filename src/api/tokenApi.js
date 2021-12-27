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
    return requestExplorerServiceV1.get(`node_api/tokens`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }

  get(id) {
    const data = {id};
    return requestExplorerServiceV1.get(`node_api/token`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }

  getHistory(id, timestamp, hash, page) {
    const data = {id, timestamp, hash, page, count: TX_COUNT};
    return requestExplorerServiceV1.get(`node_api/token_history`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default tokenApi;
