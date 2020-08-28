/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 'data' object with latest data. content:
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
  data: null,
  isVersionAllowed: undefined,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      let newData = action.payload;
      newData['date'] = new Date(newData.time*1000);
      return Object.assign({}, state, {data: newData});
    case 'is_version_allowed_update':
      return Object.assign({}, state, {isVersionAllowed: action.payload.allowed});
    default:
      return state;
  }
};

export default rootReducer;