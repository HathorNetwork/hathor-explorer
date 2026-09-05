/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from 'axios';
import { EXPLORER_SERVICE_BASE_URL } from '../constants';
import { parseJsonBigInt } from './jsonBigIntResponse';

const errorHandler = error => {
  console.log('ERROR RESPONSE', error);
};

const requestExplorerServiceV1 = () => {
  const defaultOptions = {
    baseURL: EXPLORER_SERVICE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    // Preserve full integer precision: at 18 decimals, base-unit amounts exceed
    // Number.MAX_SAFE_INTEGER, which the default JSON parsing rounds silently.
    // Overriding transformResponse replaces axios' default JSON.parse.
    transformResponse: [parseJsonBigInt],
  };

  const instance = axios.create(defaultOptions);
  instance.interceptors.response.use(response => {
    return response;
  }, errorHandler);
  return instance;
};

export default requestExplorerServiceV1();
