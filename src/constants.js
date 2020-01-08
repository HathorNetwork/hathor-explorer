/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const BASE_URL = process.env.REACT_APP_BASE_URL || "https://node2.mainnet.hathor.network/v1a/";

let tmp_ws_url = process.env.REACT_APP_WS_URL || "wss://node2.mainnet.hathor.network/v1a/ws/";
if (!(tmp_ws_url.startsWith('ws:') || tmp_ws_url.startsWith('wss:'))) {
  if (tmp_ws_url.startsWith('/')) {
    tmp_ws_url = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + tmp_ws_url;
  } else {
    tmp_ws_url = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + window.location.pathname + "/" + tmp_ws_url;
  }
}

export const WS_URL = tmp_ws_url;

export const TX_COUNT = 10;

export const DASHBOARD_BLOCKS_COUNT = 6;

export const DASHBOARD_TX_COUNT = 6;

export const GENESIS_BLOCK = [
  '000000a0f82cfee5431e03b071364970861ffa1b0633f73ca7f462987ec34195'
]

export const GENESIS_TX = [
  '000000831cff82fa730cbdf8640fae6c130aab1681336e2f8574e314a5533849',
  '0000001df6f77892cd562a2d7829bc17d0130546edfc6a81e0a431af4b8aa51e'
]

export const DASHBOARD_CHART_TIME = 200;

export const DECIMAL_PLACES = 2;

export const VERSION = '0.4.1';

export const MIN_API_VERSION = '0.29.0';

// Max level of the graph generated by the full node in the transaction detail screen
export const MAX_GRAPH_LEVEL = 1

// Token maks
// First bit in the index byte indicates whether it's an authority output
export const TOKEN_AUTHORITY_MASK = 0b10000000

/**
 * Hathor token config
 */
export const HATHOR_TOKEN_CONFIG = {'name': 'Hathor', 'symbol': 'HTR', 'uid': '00'};

/**
 * Hathor token default index
 */
export const HATHOR_TOKEN_INDEX = 0;
