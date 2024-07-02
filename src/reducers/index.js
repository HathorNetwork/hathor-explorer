/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 */

/**
 * Initial state
 * @type {Object}
 * @property {DashboardData} data - object with latest data.
 * @property {boolean} isVersionAllowed - if the backend API version is allowed for this admin.
 * @property {ServerInfo} serverInfo - server info from version api.
 * @property {boolean} apiLoadError - If we had an error while loading the initial data from the server.
 */
const initialState = {
  data: null,
  isVersionAllowed: undefined,
  serverInfo: null,
  apiLoadError: false,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      return Object.assign({}, state, {data: action.payload});
    case 'is_version_allowed_update':
      return Object.assign({}, state, {isVersionAllowed: action.payload.allowed});
    case 'api_load_error_update':
      return Object.assign({}, state, {apiLoadError: action.payload.apiLoadError});
    case 'update_server_info':
      return Object.assign({}, state, {serverInfo: action.payload});
    default:
      return state;
  }
};

export default rootReducer;
