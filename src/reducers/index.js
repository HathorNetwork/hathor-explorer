/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DASHBOARD_CHART_TIME } from '../constants';

/*
 'data' list content:
 {
  'date': Date object,
  'transactions': int,
  'blocks': int,
  'hash_rate': float (hashes/s),
  'peers': int,
  'txRate': float (tx/s),
  'block_hash_rate': float (hashes/s),
  'tx_hash_rate': float (hashes/s),
  'time': float (timestamp), 
  'type': 'dashboard:metrics',
  }
  'isVersionAllowed': if the backend API version is allowed for this admin (boolean)
*/

const initialState = {
  data: [],
  isVersionAllowed: undefined,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      let data = state.data.slice(0);
      let newData = action.payload;
      newData['date'] = new Date(newData.time*1000);
      data.push(action.payload);
      if (data.length > DASHBOARD_CHART_TIME) data.shift();
      // Adding txs/s metric
      if (data.length === 1) {
        newData['txRate'] = 0;
      } else {
        const beforeLastData = data[data.length - 2];
        const timeDiff = beforeLastData.time - newData.time;
        const txDiff = beforeLastData.transactions - newData.transactions;
        if (timeDiff === 0) {
          // Preventing division by 0
          newData['txRate'] = beforeLastData.txRate;
        } else {
          newData['txRate'] = Math.max(0, txDiff / timeDiff);
        }
      }
      return Object.assign({}, state, {data: data});
    case 'is_version_allowed_update':
      return Object.assign({}, state, {isVersionAllowed: action.payload.allowed});
    default:
      return state;
  }
};

export default rootReducer;