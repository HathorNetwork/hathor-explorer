/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { constants } from '@hathor/wallet-lib';
import { cloneDeep } from 'lodash';

/**
 * Dashboard data from websocket updates
 * @typedef {Object} DashboardData
 * @property {Date} date
 * @property {number} transactions
 * @property {number} blocks
 * @property {number} hash_rate
 * @property {number} peers
 * @property {number} txRate
 * @property {number} block_hash_rate
 * @property {number} tx_hash_rate
 * @property {number} time
 * @property {string} type
 */

/**
 * Server info from version api
 * @typedef {Object} ServerInfo
 * @property {string} version
 * @property {string} network
 * @property {number} min_tx_weight
 * @property {number} min_tx_weight_coefficient
 * @property {number} min_tx_weight_k
 * @property {number} token_deposit_percentage
 * @property {number} reward_spend_min_blocks
 * @property {number} max_number_inputs
 * @property {number} max_number_outputs
 * @property {Object|undefined|null} native_token
 * @property {string} native_token.name
 * @property {string} native_token.symbol
 * @property {number} decimal_places
 */

/**
 * Explorer redux store
 * @typedef {Object} ReduxStore
 * @property {DashboardData} data - object with latest data.
 * @property {boolean} isVersionAllowed - if the backend API version is allowed for this admin.
 * @property {ServerInfo} serverInfo - server info from version api.
 * @property {boolean} apiLoadError - If we had an error while loading the initial data from the server.
 */

/**
 * Initial state
 * @type {ReduxStore}
 */
const initialState = {
  data: null,
  isVersionAllowed: undefined,
  serverInfo: {
    native_token: constants.DEFAULT_NATIVE_TOKEN_CONFIG,
    decimal_places: constants.DECIMAL_PLACES,
  },
  apiLoadError: false,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      return Object.assign({}, state, { data: action.payload });
    case 'is_version_allowed_update':
      return Object.assign({}, state, { isVersionAllowed: action.payload.allowed });
    case 'api_load_error_update':
      return Object.assign({}, state, { apiLoadError: action.payload.apiLoadError });
    case 'update_server_info':
      return setServerInfo(state, action);
    default:
      return state;
  }
};

/**
 * Set the server info a.k.a '/version' data on storage.
 * Will update keys based on default values.
 *
 * @param {ReduxStore} state - Current store state.
 * @param {payload} ServerInfo - Server info to save on storage.
 * @returns {ReduxStore} New state for the store.
 */
const setServerInfo = (state, { payload }) => {
  const serverInfo = cloneDeep(payload);
  // Default values
  serverInfo.decimal_places = serverInfo.decimal_places ?? constants.DECIMAL_PLACES;
  serverInfo.native_token = serverInfo.native_token ?? constants.DEFAULT_NATIVE_TOKEN_CONFIG;

  return {
    ...state,
    serverInfo,
  };
};

export default rootReducer;
