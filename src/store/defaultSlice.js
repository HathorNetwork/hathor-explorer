/* eslint-disable no-param-reassign */
// Disabling no-param-reassign because ImmerJS uses it as a default pattern
// See https://github.com/immerjs/immer/issues/189

import { createSlice } from '@reduxjs/toolkit';
import { constants } from '@hathor/wallet-lib';
import themeUtils from '../utils/theme';

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
 * @property {'dark'|'light'} theme - current theme of the app.
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
  theme: themeUtils.initializeTheme(),
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    dashboardUpdate(state, action) {
      state.data = action.payload;
    },
    isVersionAllowedUpdate(state, action) {
      state.isVersionAllowed = action.payload.allowed;
    },
    apiLoadErrorUpdate(state, action) {
      state.apiLoadError = action.payload.apiLoadError;
    },
    updateServerInfo(state, action) {
      const serverInfo = { ...action.payload };
      serverInfo.decimal_places = serverInfo.decimal_places ?? constants.DECIMAL_PLACES;
      serverInfo.native_token = serverInfo.native_token ?? constants.DEFAULT_NATIVE_TOKEN_CONFIG;
      state.serverInfo = serverInfo;
    },
    toggleTheme(state) {
      const currentTheme = state.theme === 'light' ? 'dark' : 'light';
      themeUtils.applyTheme(currentTheme);
      state.theme = currentTheme;
    },
  },
});

export const {
  dashboardUpdate,
  isVersionAllowedUpdate,
  apiLoadErrorUpdate,
  updateServerInfo,
  toggleTheme,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
