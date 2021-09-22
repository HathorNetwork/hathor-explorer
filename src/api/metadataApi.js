/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { requestExplorerServiceV1 } from './axiosInstance';

const metadataApi = {
  getDagMetadata(id) {
    return requestExplorerServiceV1().get(`metadata/dag`, {params: {id}}).then((res) => {
      if (res && id in res.data) {
        return res.data[id]
      }
    }).catch((error) => {
      // something wrong with request
    });
  }
};

export default metadataApi;
