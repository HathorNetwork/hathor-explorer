/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestClient from './axiosInstance';

const networkApi = {
  getPeers() {
    requestClient.interceptors.request.use(config => { 
      config.baseURL = 'http://localhost:3001/dev/';
      return config; 
    });
    return requestClient.get(`node`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },
  getPeer(hash) {
    requestClient.interceptors.request.use(config => { 
      config.baseURL = 'http://localhost:3001/dev/';
      return config; 
    });
    return requestClient.get(`node/${hash}`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default networkApi;