/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const featureApi = {

  async getFeatures() {
    return requestExplorerServiceV1.get(`node_api/feature`).then(res => {
      return res.data
    });
  },

};

export default featureApi;
