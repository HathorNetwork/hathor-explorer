/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducers/index';

const store = configureStore({ reducer: rootReducer });

export default store;
