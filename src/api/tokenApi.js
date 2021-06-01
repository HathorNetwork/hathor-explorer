/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { requestClientV1 } from './axiosInstance';

const tokenApi = {
  getMetadata(id) {
    return requestClientV1().get(`token/${id}/meta`).then((res) => {
      return res.data
    }).catch((error) => {
      // throw new Error(error);
    });
  }
};

export default tokenApi;
