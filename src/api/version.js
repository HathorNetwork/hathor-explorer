/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const versionApi = {
  getVersion() {
    return requestExplorerServiceV1.get(`node_api/version`).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },
};

export default versionApi;
