/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/images/hathor-white-logo.png';
import HathorAlert from './HathorAlert';
import Version from './Version';
import hathorLib from '@hathor/wallet-lib';
import ConditionalNavigation from './ConditionalNavigation';
import { useFlag } from '@unleash/proxy-client-react';
import {
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
} from '../constants';

class Navigation extends React.Component {
  constructor(props) {
    super(props);

    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.search = this.search.bind(this);
  }

  handleKeyUp(e) {
    if (e.key === 'Enter') {
      this.search();
    }
  }

  search() {
    const text = this.refs.txSearch.value;

    if (text) {
      const regex = /[A-Fa-f\d]{64}/g;
      if (regex.test(text)) {
        // It's a valid hash
        this.props.history.push(`/transaction/${text}`);
      } else {
        const network = hathorLib.config.getNetwork();
        const addressObj = new hathorLib.Address(text, { network });
        if (addressObj.isValid()) {
          // It's a valid address
          this.props.history.push(`/address/${text}`);
        } else {
          this.showError();
        }
      }
    }
  }

  showError() {
    this.refs.alertError.show(3000);
  }

  showTokensTab() {
    return useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`)
      || useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  }

  render() {
    return (
      <div className="main-nav">
        <nav className="navbar navbar-expand-lg navbar-dark pl-3 pl-lg-0">
          <div className="d-flex flex-column align-items-center">
            <Link className="navbar-brand" to="/" href="/">
              <img src={logo} alt="" />
            </Link>
          </div>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink to="/" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Transactions</NavLink>
              </li>
              {this.showTokensTab() && (
                <li className="nav-item dropdown">
                  <span className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Tokens
                  </span>
                  <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <ul>
                      <ConditionalNavigation to="/tokens" label="Token list" featureToggle={`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`} />
                      <ConditionalNavigation to="/token_balances" label="Token balances" featureToggle={`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`} />
                    </ul>
                  </div>
                </li>
              )}
              <li className="nav-item">
                <NavLink to="/network" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Network</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/statistics" exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>Statistics</NavLink>
              </li>
              <li className="nav-item dropdown">
                <span className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Tools
                </span>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <NavLink to="/decode-tx/" exact className="nav-link">Decode Tx</NavLink>
                  <NavLink to="/push-tx/" exact className="nav-link">Push Tx</NavLink>
                  <NavLink to="/dag/" exact className="nav-link">DAG</NavLink>
                  <NavLink to="/features/" exact className="nav-link">Features</NavLink>
                </div>
              </li>
            </ul>
            <div className="navbar-right d-flex flex-row align-items-center navigation-search">
              <div className="d-flex flex-row align-items-center">
                <input className="form-control mr-2" type="search" placeholder="Search tx or address" aria-label="Search" ref="txSearch" onKeyUp={this.handleKeyUp} />
                <i className="fa fa-search pointer" onClick={this.search}></i>
              </div>
              <Version />
            </div>
          </div>
        </nav>
        <HathorAlert ref="alertError" text="Invalid hash format or address" type="danger" />
      </div>
    );
  }
};

export default Navigation;
