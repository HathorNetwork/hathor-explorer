/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { requestExplorerServiceV1 } from './axiosInstance';

const tokenApi = {
  get(id) {
    return requestExplorerServiceV1().get(`token/${id}`).then((res) => {
      return res.data
    }).catch((error) => {
      // something wrong with request
    });
  },
  getMetadata(id) {
    return requestExplorerServiceV1().get(`metadata/token/${id}`).then((res) => {
      return res.data
    }).catch((error) => {
      // something wrong with request
    });
  }
};

export default tokenApi;
