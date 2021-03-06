/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BASE_URL, EXPLORER_SERVICE_BASE_URL } from '../constants.js';
const axios = require('axios');

const errorHandler = (error) => {
  console.log("ERROR RESPONSE", error);
}

const requestClient = () => {
  const defaultOptions = {
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  let instance = axios.create(defaultOptions);
  instance.interceptors.response.use((response) => {
    return response;
  }, errorHandler);
  return instance;
}

const requestExplorerServiceV1 = () => {
  const defaultOptions = {
    baseURL: EXPLORER_SERVICE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  let instance = axios.create(defaultOptions);
  instance.interceptors.response.use((response) => {
    return response;
  }, errorHandler);
  return instance;
}

export default requestClient();

export { requestExplorerServiceV1 };
