/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { txApi as libTxApi } from '@hathor/wallet-lib';
import requestExplorerServiceV1 from './axiosInstance';
import helpers from '../utils/helpers';
import { MAX_GRAPH_LEVEL } from '../constants';

/**
 * Explorer Service implementation of graphviz API
 * Used in full explorer mode
 */
const explorerGraphvizApi = {
  dotNeighbors(tx, graphType) {
    const data = { tx, graph_type: graphType, max_level: MAX_GRAPH_LEVEL };
    return requestExplorerServiceV1.get(`node_api/graphviz/neighbours.dot`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(
          res?.data?.message || res?.message || 'Unknown error at get node neighbors'
        );
      }
    );
  },
};

/**
 * Adapter that routes to the correct implementation based on explorer mode
 * - Full mode: uses Explorer Service API (explorerGraphvizApi)
 * - Basic mode: uses wallet-lib API (libTxApi.getGraphvizNeighbors)
 */
const graphvizApi = {
  /**
   * Get graphviz dot format for transaction neighbors
   *
   * @param {string} tx Transaction hash
   * @param {string} graphType Type of graph ('funds', 'verification', etc.)
   */
  dotNeighbors(tx, graphType) {
    if (helpers.isExplorerModeFull()) {
      return explorerGraphvizApi.dotNeighbors(tx, graphType);
    }

    // Wallet-lib requires a resolve callback and maxLevel parameter, wrap in promise
    return new Promise((resolve, reject) => {
      libTxApi
        .getGraphvizNeighbors(tx, graphType, MAX_GRAPH_LEVEL, data => resolve(data))
        .catch(err => reject(err));
    });
  },
};

export default graphvizApi;
