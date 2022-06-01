/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';
import { get } from 'lodash';

const handleResponse = (response) => {
  // If status is not retrieved, we assume an internal error ocurred, giving the status code 500
  // Currently 200 is always returned for success responses
  if (get(response, 'status', 500) !== 200) {
    return {
      'error': true,
    };
  }

  return {
    ...response,
    error: false,
  };
};

const tokensApi = {
  async getList(searchText, sortBy, order, searchAfter) {
    const data = {
      'search_text': searchText,
      'sort_by': sortBy,
      'order': order,
      'search_after': searchAfter.join(','),
    };

    const response = await requestExplorerServiceV1.get('tokens', { params: data });

    return handleResponse(response);
  },

  async getBalances(tokenId, searchText, sortBy, order, searchAfter) {
    const data = {
      'token_id': tokenId,
      'search_text': searchText,
      'sort_by': sortBy,
      'order': order,
      'search_after': searchAfter.join(',')
    };

    const response = await requestExplorerServiceV1.get('token_balances', { params: data });

    return handleResponse(response);
  },

  async getBalanceInformation(tokenId) {
    const data = {
      'token_id': tokenId,
    };

    const response = await requestExplorerServiceV1.get('token_balances/information', { params: data });

    return handleResponse(response);
  },
};

export default tokensApi;
