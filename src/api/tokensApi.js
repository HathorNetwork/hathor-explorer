/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';
import { get } from 'lodash';

const tokensApi = {
  async getList(searchText, sortBy, order, searchAfter) {
    const data = {
      'search_text': searchText,
      'sort_by': sortBy,
      'order': order,
      'search_after': searchAfter.join(',')
    };

    let result = await requestExplorerServiceV1.get(`tokens`, { params: data });

    // If status is not retrieved, we assume an internal error ocurred, giving the status code 500
    // Currently 200 is always returned for success responses
    if (get(result, 'status', 500) !== 200) {
        return {
            'error': true
        }
    }

    result.error = false;

    return result;
  },

  async getBalances(tokenId, searchText, sortBy, order, searchAfter) {
    const data = {
      'token_id': tokenId,
      'search_text': searchText,
      'sort_by': sortBy,
      'order': order,
      'search_after': searchAfter.join(',')
    };

    let result = await requestExplorerServiceV1.get(`token_balances`, { params: data });

    // If status is not retrieved, we assume an internal error ocurred, giving the status code 500
    // Currently 200 is always returned for success responses
    if (get(result, 'status', 500) !== 200) {
        return {
            'error': true
        }
    }

    result.error = false;

    return result;
  },
};

export default tokensApi;
