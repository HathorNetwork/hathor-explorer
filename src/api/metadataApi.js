/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const metadataApi = {
  getDagMetadata(id) {
    return requestExplorerServiceV1
      .get(`metadata/dag`, { params: { id } })
      .then(res => {
        if (res && id in res.data) {
          return res.data[id];
        }
        return undefined;
      })
      .catch(error => {
        console.error(`Error fetching dag metadata for ${id}`, error);
      });
  },
};

export default metadataApi;
