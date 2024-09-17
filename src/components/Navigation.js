/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import { NavLink, Link, useHistory } from 'react-router-dom';
import hathorLib from '@hathor/wallet-lib';
import { useFlag } from '@unleash/proxy-client-react';
import logo from '../assets/images/hathor-white-logo.png';
import HathorAlert from './HathorAlert';
import Version from './Version';
import ConditionalNavigation from './ConditionalNavigation';
import {
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
} from '../constants';

function Navigation() {
  const history = useHistory();
  const alertErrorRef = useRef(null);
  const txSearchRef = useRef(null);
  const isTokensBaseEnabled = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`);
  const isTokensBalanceEnabled = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  const showTokensTab = isTokensBalanceEnabled || isTokensBaseEnabled;

  const handleKeyUp = e => {
    if (e.key === 'Enter') {
      search();
    }
  };

  const search = () => {
    const text = txSearchRef.current.value;

    if (text) {
      const regex = /[A-Fa-f\d]{64}/g;
      if (regex.test(text)) {
        // It's a valid hash
        history.push(`/transaction/${text}`);
      } else {
        const network = hathorLib.config.getNetwork();
        const addressObj = new hathorLib.Address(text, { network });
        if (addressObj.isValid()) {
          // It's a valid address
          history.push(`/address/${text}`);
        } else {
          showError();
        }
      }
    }
  };

  const showError = () => {
    alertErrorRef.current.show(3000);
  };

  return (
    <div className="main-nav">
      <nav className="navbar navbar-expand-lg navbar-dark ps-3 ps-lg-0">
        <div className="d-flex flex-column align-items-center">
          <Link className="navbar-brand" to="/" href="/">
            <img src={logo} alt="" />
          </Link>
        </div>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink
                to="/"
                exact
                className="nav-link"
                activeClassName="active"
                activeStyle={{ fontWeight: 'bold' }}
              >
                Transactions
              </NavLink>
            </li>
            {showTokensTab && (
              <li className="nav-item dropdown">
                <span
                  className="nav-link dropdown-toggle"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Tokens
                </span>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <ul>
                    <ConditionalNavigation
                      to="/tokens"
                      label="Token list"
                      featureToggle={`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`}
                    />
                    <ConditionalNavigation
                      to="/token_balances"
                      label="Token balances"
                      featureToggle={`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`}
                    />
                  </ul>
                </div>
              </li>
            )}
            <li className="nav-item">
              <NavLink
                to="/network"
                exact
                className="nav-link"
                activeClassName="active"
                activeStyle={{ fontWeight: 'bold' }}
              >
                Network
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/statistics"
                exact
                className="nav-link"
                activeClassName="active"
                activeStyle={{ fontWeight: 'bold' }}
              >
                Statistics
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Tools
              </span>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                <NavLink to="/decode-tx/" exact className="nav-link">
                  Decode Tx
                </NavLink>
                <NavLink to="/push-tx/" exact className="nav-link">
                  Push Tx
                </NavLink>
                <NavLink to="/dag/" exact className="nav-link">
                  DAG
                </NavLink>
                <NavLink to="/features/" exact className="nav-link">
                  Features
                </NavLink>
              </div>
            </li>
          </ul>
          <div className="d-flex flex-row align-items-center ms-auto navigation-search">
            <div className="d-flex flex-row align-items-center">
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search tx or address"
                aria-label="Search"
                ref={txSearchRef}
                onKeyUp={handleKeyUp}
              />
              <i className="fa fa-search pointer" onClick={search}></i>
            </div>
            <Version />
          </div>
        </div>
      </nav>
      <HathorAlert ref={alertErrorRef} text="Invalid hash format or address" type="danger" />
    </div>
  );
}

export default Navigation;
