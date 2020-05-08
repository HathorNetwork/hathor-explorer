/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestClient from './economicsAxiosInstance';

const economicsApi = {
  getTotalSupply() {
    return requestClient.get(`total-supply`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getCirculatingSupply() {
    return requestClient.get(`circulating-supply`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default economicsApi;
