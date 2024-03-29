/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import FlagProvider from '@unleash/proxy-client-react';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './index.css';

import store from "./store/index";
import { Provider } from "react-redux";
import { UNLEASH_CONFIG } from './constants';

ReactDOM.render(
  <FlagProvider config={UNLEASH_CONFIG}>
    <Provider store={store}>
      <App />
    </Provider>
  </FlagProvider>,
  document.getElementById('root')
);
