/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const networkApi = {
  getPeerList() {
    return requestExplorerServiceV1.get(`node`).then((res) => {
      if (!res.data) {
        throw new Error("unknown_error");
      }
      return res.data
    }).catch((res) => {
      throw new Error(res.data.message);
    });
  },
  getPeer(hash) {
    return requestExplorerServiceV1.get(`node/${hash}`).then((res) => {
      if (!res.data) {
        throw new Error("unknown_error");
      }
      return res.data
    }).catch((res) => {
      throw new Error(res.data.message);
    });
  }
};

export default networkApi;
