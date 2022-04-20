/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const tokensApi = {
    async getList(searchText, sortBy, order, searchAfter) {
        const data = {
            "search_text": searchText,
            "sort_by": sortBy,
            "order": order,
            "search_after": searchAfter.join(",")
        };

        const result = await requestExplorerServiceV1.get(`tokens`, { params: data });
        return result;
    },
};

export default tokensApi;
