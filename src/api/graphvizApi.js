/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';
import { MAX_GRAPH_LEVEL } from '../constants';

const graphvizApi = {
  dotNeighbors(tx, graphType) {
    const data = {tx, "graph_type": graphType, "max_level": MAX_GRAPH_LEVEL}
    return requestExplorerServiceV1.get(`node_api/graphviz/neighbours.dot`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },
};

export default graphvizApi;
