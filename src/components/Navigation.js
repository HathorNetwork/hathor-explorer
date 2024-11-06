/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState } from 'react';
import { NavLink, Link, useHistory } from 'react-router-dom';
import hathorLib from '@hathor/wallet-lib';
import { useFlag } from '@unleash/proxy-client-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNewUiEnabled } from '../hooks';
import logo from '../assets/images/hathor-white-logo.png';
import moon from '../assets/images/moon.svg';
import sun from '../assets/images/sun-dark.svg';
import { ReactComponent as NewLogo } from '../assets/images/new-logo.svg';
import { ReactComponent as GlobeNetwork } from '../assets/images/global.svg';
import { ReactComponent as SearchIcon } from '../assets/images/search-icon.svg';
import { ReactComponent as MenuIcon } from '../assets/images/sidebar-menu.svg';
import { ReactComponent as ArrorDownNavItem } from '../assets/images/arrow-down-nav-dropdown.svg';
import HathorAlert from './HathorAlert';
import Version from './Version';
import ConditionalNavigation from './ConditionalNavigation';
import Sidebar from './Sidebar';
import {
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
  REACT_APP_NETWORK,
} from '../constants';
import { toggleTheme } from '../actions';

function Navigation() {
  const history = useHistory();
  const dispatch = useDispatch();
  const alertErrorRef = useRef(null);
  const txSearchRef = useRef(null);
  const isTokensBaseEnabled = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`);
  const isTokensBalanceEnabled = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  const theme = useSelector(state => state.theme);
  const newUiEnabled = useNewUiEnabled();
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const showTokensTab = isTokensBalanceEnabled || isTokensBaseEnabled;

  const showSidebarHandler = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
  };

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

  const renderNewUi = () => {
    const hathorNetwork = `Hathor ${REACT_APP_NETWORK}`;

    return (
      <nav>
        <div className="hide-logo-container-mobile">
          <div className="newLogo-explorer-container">
            <div className="d-flex flex-column align-items-center">
              <Link className="navbar-brand" to="/" href="/">
                <NewLogo
                  className={`newLogo ${theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'}`}
                />
              </Link>
            </div>
            {!showSearchInput ? (
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span>EXPLORER</span>
              </button>
            ) : (
              ''
            )}
          </div>
          <div className="hide-network-mobile">
            <GlobeNetwork
              className={`${
                theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'
              } theme-network-logo`}
            />
            <span className="nav-title">{hathorNetwork}</span>
          </div>
        </div>
        <div className="nav-tabs-container hide-tabs">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink
                to="/"
                exact
                className="nav-link"
                activeClassName="active"
                activeStyle={{ fontWeight: 'bold' }}
              >
                Home
              </NavLink>
            </li>
            {showTokensTab && (
              <ul className="nav-item dropdown">
                <span
                  className="nav-link dropdown-toggle custom-dropdown-toggle"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Tokens
                  <ArrorDownNavItem className="dropdown-icon" />
                </span>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
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
                  </li>
                </div>
              </ul>
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
                className="nav-link dropdown-toggle custom-dropdown-toggle"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Tools
                <ArrorDownNavItem className="dropdown-icon" />
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
                className="form-control me-2 bg-dark text-light navigation-search-input"
                type="search"
                placeholder={`Search here`}
                aria-label="Search"
                ref={txSearchRef}
                onKeyUp={handleKeyUp}
              />
            </div>
          </div>
        </div>
        <div className="network-container hide-tabs">
          <img
            src={theme === 'dark' ? sun : moon}
            alt="themeColorButton"
            className="theme-color-btn"
            onClick={() => dispatch(toggleTheme())}
            role="button"
          />
          <div className="network-icon-container">
            <GlobeNetwork
              className={`${theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'}`}
            />
            <span className="nav-title">{hathorNetwork}</span>
          </div>
        </div>
        <div className="mobile-tabs">
          {showSearchInput ? (
            <input
              type="search"
              className={`form-control me-2 bg-dark text-light mobile-search-input ${
                showSearchInput ? 'expanded' : ''
              }`}
              placeholder="Search..."
              aria-label="Search"
              ref={txSearchRef}
              onKeyUp={handleKeyUp}
              onBlur={() => setShowSearchInput(false)}
              autoFocus
            />
          ) : (
            <SearchIcon
              fill={theme === 'dark' ? 'white' : 'black'}
              onClick={toggleSearchInput}
              className="mobile-search-icon"
            />
          )}
          <MenuIcon
            fill={theme === 'dark' ? 'white' : 'black'}
            onClick={showSidebarHandler}
            className="mobile-sidebar-icon"
          />
        </div>
        <Sidebar close={() => setShowSidebar(false)} open={showSidebar} />
      </nav>
    );
  };

  const renderUi = () => {
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
  };

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default Navigation;
