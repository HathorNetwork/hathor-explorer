/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ncApi as libNanoApi } from '@hathor/wallet-lib';
import requestExplorerServiceV1 from './axiosInstance';
import helpers from '../utils/helpers';

/**
 * Explorer Service implementation of nano API
 * Used in full explorer mode
 */
const explorerNanoApi = {
  /**
   * Get the state of a nano contract
   *
   * @param {string} id Nano contract id
   * @param {string[]} fields List of fields to get the state
   * @param {string[]} balances List of token uids to get the balance
   * @param {string[]} calls List of private methods with parameters to call
   *
   * For more details, see full node api docs
   */
  getState(id, fields, balances, calls) {
    const data = { id, fields, balances, calls };
    return requestExplorerServiceV1
      .get(`node_api/nc_state`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get nc state for ${id}`
        );
      });
  },

  /**
   * Get the history of transactions of a nano contract
   *
   * @param {string} id Nano contract id
   * @param {number | null} count Number of elements to get the history
   * @param {string | null} after Hash of the tx to get as reference for after pagination
   * @param {string | null} before Hash of the tx to get as reference for before pagination
   *
   * For more details, see full node api docs
   */
  getHistory(id, count, after, before) {
    const data = { id };
    if (count) {
      data.count = count;
    }
    if (after) {
      data.after = after;
    }
    if (before) {
      data.before = before;
    }
    return requestExplorerServiceV1
      .get(`node_api/nc_history`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(err?.data?.message || err?.message || `Unknown error on get nc history`);
      });
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
    return requestExplorerServiceV1
      .get(`node_api/nc_blueprint_information`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message ||
            err?.message ||
            `Unknown error on get blueprint data for ${blueprintId}`
        );
      });
  },

  /**
   * Get the blueprint source code
   *
   * @param {string} blueprintId ID of the blueprint
   *
   * For more details, see full node api docs
   */
  getBlueprintSourceCode(blueprintId) {
    const data = { blueprint_id: blueprintId };
    return requestExplorerServiceV1
      .get(`node_api/nc_blueprint_source_code`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message ||
            err?.message ||
            `Unknown error on get blueprint source code for ${blueprintId}`
        );
      });
  },

  /**
   * Get built in blueprint list
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search Blueprint ID to search for in the API
   *
   * For more details, see full node api docs
   */
  getBuiltInBlueprintList(count, after, before, search) {
    const data = {};
    if (count) {
      data.count = count;
    }
    if (after) {
      data.after = after;
    }
    if (before) {
      data.before = before;
    }
    if (search) {
      data.search = search;
    }
    return requestExplorerServiceV1
      .get(`node_api/nc_builtin_blueprints`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get builtin blueprint list`
        );
      });
  },

  /**
   * Get on chain blueprint list
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search Blueprint ID to search for in the API
   * @param {string | null} order Order of the sorting ('asc' or 'desc')
   *
   * For more details, see full node api docs
   */
  getOnChainBlueprintList(count, after, before, search, order) {
    const data = {};
    if (count) {
      data.count = count;
    }
    if (after) {
      data.after = after;
    }
    if (before) {
      data.before = before;
    }
    if (search) {
      data.search = search;
    }
    if (order) {
      data.order = order;
    }
    return requestExplorerServiceV1
      .get(`node_api/nc_on_chain_blueprints`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get on chain blueprint list`
        );
      });
  },

  /**
   * Get list of nano contract creation txs
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search ID of the blueprint or nano contract creation to filter in the API
   * @param {string | null} order Order of the sorting ('asc' or 'desc')
   *
   * For more details, see full node api docs
   */
  getNanoContractCreationList(count, after, before, search, order) {
    const data = {};
    if (count) {
      data.count = count;
    }
    if (after) {
      data.after = after;
    }
    if (before) {
      data.before = before;
    }
    if (search) {
      data.search = search;
    }
    if (order) {
      data.order = order;
    }
    return requestExplorerServiceV1
      .get(`node_api/nc_creation_list`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get nano contract creation list`
        );
      });
  },

  /**
   * Get logs for a nano contract execution
   *
   * @param {string} id Nano contract id
   *
   * For more details, see full node api docs
   */
  getLogs(id) {
    const data = { id };
    return requestExplorerServiceV1
      .get(`node_api/nc_execution_logs`, { params: data })
      .then(res => res.data)
      .catch(err => {
        throw new Error(
          err?.data?.message || err?.message || `Unknown error on get nano contract logs for ${id}`
        );
      });
  },
};

/**
 * Adapter that routes to the correct implementation based on explorer mode
 * - Full mode: uses Explorer Service API (explorerNanoApi)
 * - Basic mode: uses wallet-lib API (libNanoApi)
 */
const nanoApi = {
  /**
   * Get the state of a nano contract
   *
   * @param {string} id Nano contract id
   * @param {string[]} fields List of fields to get the state
   * @param {string[]} balances List of token uids to get the balance
   * @param {string[]} calls List of private methods with parameters to call
   */
  getState(id, fields, balances, calls) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getState(id, fields, balances, calls)
      : libNanoApi.getNanoContractState(id, fields, balances, calls);
  },

  /**
   * Get the history of transactions of a nano contract
   *
   * @param {string} id Nano contract id
   * @param {number | null} count Number of elements to get the history
   * @param {string | null} after Hash of the tx to get as reference for after pagination
   * @param {string | null} before Hash of the tx to get as reference for before pagination
   */
  getHistory(id, count, after, before) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getHistory(id, count, after, before)
      : libNanoApi.getNanoContractHistory(id, count, after, before);
  },

  /**
   * Get the blueprint information
   *
   * @param {string} blueprintId ID of the blueprint
   */
  getBlueprintInformation(blueprintId) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getBlueprintInformation(blueprintId)
      : libNanoApi.getBlueprintInformation(blueprintId);
  },

  /**
   * Get the blueprint source code
   *
   * @param {string} blueprintId ID of the blueprint
   */
  async getBlueprintSourceCode(blueprintId) {
    if (helpers.isExplorerModeFull()) {
      return explorerNanoApi.getBlueprintSourceCode(blueprintId);
    }

    try {
      const data = await libNanoApi.getBlueprintSourceCode(blueprintId);
      return data;
    } catch (error) {
      // Handle NanoRequestError from wallet-lib
      throw new Error(error.message || 'Error getting blueprint source code');
    }
  },

  /**
   * Get built in blueprint list
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search Blueprint ID to search for in the API
   */
  getBuiltInBlueprintList(count, after, before, search) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getBuiltInBlueprintList(count, after, before, search)
      : libNanoApi.getBuiltInBlueprintList(count, after, before, search);
  },

  /**
   * Get on chain blueprint list
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search Blueprint ID to search for in the API
   * @param {string | null} order Order of the sorting ('asc' or 'desc')
   */
  getOnChainBlueprintList(count, after, before, search, order) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getOnChainBlueprintList(count, after, before, search, order)
      : libNanoApi.getOnChainBlueprintList(count, after, before, search, order);
  },

  /**
   * Get list of nano contract creation txs
   *
   * @param {number | null} count Number of elements to get the list
   * @param {string | null} after ID of the blueprint to get as reference for after pagination
   * @param {string | null} before ID of the blueprint to get as reference for before pagination
   * @param {string | null} search ID of the blueprint or nano contract creation to filter in the API
   * @param {string | null} order Order of the sorting ('asc' or 'desc')
   */
  getNanoContractCreationList(count, after, before, search, order) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getNanoContractCreationList(count, after, before, search, order)
      : libNanoApi.getNanoContractCreationList(count, after, before, search, order);
  },

  /**
   * Get logs for a nano contract execution
   *
   * @param {string} id Nano contract id
   */
  getLogs(id) {
    return helpers.isExplorerModeFull()
      ? explorerNanoApi.getLogs(id)
      : libNanoApi.getNanoContractLogs(id);
  },
};

export default nanoApi;
