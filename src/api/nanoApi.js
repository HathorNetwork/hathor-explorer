/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import requestExplorerServiceV1 from './axiosInstance';

const nanoApi = {
  /**
   * Get the state of a nano contract
   *
   * @param {string} id Nano contract id
   * @param {string[]} fields List of fields to get the state
   * @param {string[]} balances List of token uids to get the balance
   * @param {string[]} fields List of private methods with parameters to call
   *
   * For more details, see full node api docs
   */
  getState(id, fields, balances, calls) {
    const data = { id, fields, balances, calls };
    return requestExplorerServiceV1.get(`node_api/nc_state`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },

  /**
   * Get the history of transactions of a nano contract
   *
   * @param {string} id Nano contract id
   *
   * For more details, see full node api docs
   */
  getHistory(id) {
    const data = { id };
    return requestExplorerServiceV1.get(`node_api/nc_history`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },

  /**
   * Get the blueprint information
   *
   * @param {string} blueprintId ID of the blueprint
   *
   * For more details, see full node api docs
   */
  getBlueprintInformation(blueprintId) {
    const data = { blueprint_id: blueprintId };
    return requestExplorerServiceV1.get(`node_api/nc_blueprint_information`, { params: data }).then(
      res => {
        return res.data;
      },
      res => {
        throw new Error(res.data.message);
      }
    );
  },
};

export default nanoApi;
