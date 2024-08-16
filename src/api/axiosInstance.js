/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EXPLORER_SERVICE_BASE_URL } from '../constants.js';
import axios from 'axios';

const errorHandler = error => {
  console.log('ERROR RESPONSE', error);
};

const requestExplorerServiceV1 = () => {
  const defaultOptions = {
    baseURL: EXPLORER_SERVICE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let instance = axios.create(defaultOptions);
  instance.interceptors.response.use(response => {
    return response;
  }, errorHandler);
  return instance;
};

export default requestExplorerServiceV1();
