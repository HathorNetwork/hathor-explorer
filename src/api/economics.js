/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestClient from './economicsAxiosInstance';
import { ECONOMICS_API_URL } from '../constants';

const economicsApi = {
  getTotalSupply() {
    return requestClient.get(`total-supply`).then((res) => {
      console.log('### ', res)
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
