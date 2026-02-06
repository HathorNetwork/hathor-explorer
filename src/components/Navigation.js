/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import hathorLib from '@hathor/wallet-lib';
import { useFlag } from '@unleash/proxy-client-react';
import { useDispatch, useSelector } from 'react-redux';
import moon from '../assets/images/moon.svg';
import sun from '../assets/images/sun-dark.svg';
import { ReactComponent as NewLogo } from '../assets/images/new-logo.svg';
import { ReactComponent as GlobeNetwork } from '../assets/images/global.svg';
import { ReactComponent as SearchIcon } from '../assets/images/search-icon.svg';
import { ReactComponent as MenuIcon } from '../assets/images/sidebar-menu.svg';
import { ReactComponent as ArrorDownNavItem } from '../assets/images/arrow-down-nav-dropdown.svg';
import ConditionalNavigation from './ConditionalNavigation';
import Sidebar from './Sidebar';
import {
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
  REACT_APP_NETWORK,
} from '../constants';
import { toggleTheme } from '../store/rootSlice';
import NewHathorAlert from './NewHathorAlert';
import helpers from '../utils/helpers';

function Navigation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alertErrorRef = useRef(null);
  const txSearchRef = useRef(null);
  const isTokensBaseEnabled = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`);
  const isTokensBalanceEnabled = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  const { serverInfo, theme } = useSelector(state => ({
    serverInfo: state.serverInfo,
    theme: state.theme,
  }));
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
        navigate(`/transaction/${text}`);
      } else if (helpers.isExplorerModeFull()) {
        // Only allow address search for full mode
        const network = hathorLib.config.getNetwork();
        const addressObj = new hathorLib.Address(text, { network });
        if (addressObj.isValid()) {
          // It's a valid address
          navigate(`/address/${text}`);
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
    const hathorNetwork = `${REACT_APP_NETWORK}`;

    return (
      <>
        <nav>
          <div className="hide-logo-container-mobile">
            <div className="newLogo-explorer-container">
              <div className="d-flex flex-column align-items-start">
                <Link className="navbar-brand" to="/" href="/">
                  <NewLogo
                    className={`newLogo ${
                      theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'
                    }`}
                  />
                </Link>
                <div className="network-icon-container">
                  <GlobeNetwork
                    className={`${theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'}`}
                  />
                  <span className="nav-title">{hathorNetwork}</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`nav-tabs-container hide-tabs ${
              !helpers.isExplorerModeFull() ? 'basic-mode' : ''
            }`}
          >
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Home
                </NavLink>
              </li>
              {showTokensTab && helpers.isExplorerModeFull() && (
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
              {serverInfo.nano_contracts_enabled && (
                <li className="nav-item dropdown">
                  <span
                    className="nav-link dropdown-toggle custom-dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Nano
                    <ArrorDownNavItem className="dropdown-icon" />
                  </span>
                  <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <NavLink to="/nano_contracts/" className="nav-link">
                      Nano Contracts List
                    </NavLink>
                    <NavLink to="/blueprints/?type=on-chain" className="nav-link">
                      Blueprints List
                    </NavLink>
                  </div>
                </li>
              )}
              {helpers.isExplorerModeFull() && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/network"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Network
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/statistics"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
                      <NavLink to="/decode-tx/" className="nav-link">
                        Decode Tx
                      </NavLink>
                      <NavLink to="/push-tx/" className="nav-link">
                        Push Tx
                      </NavLink>
                      <NavLink to="/dag/" className="nav-link">
                        DAG
                      </NavLink>
                      <NavLink to="/features/" className="nav-link">
                        Features
                      </NavLink>
                    </div>
                  </li>
                </>
              )}
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
        <NewHathorAlert
          ref={alertErrorRef}
          text="Invalid hash format or address"
          type="error"
          fixedPosition
        />
      </>
    );
  };

  return renderNewUi();
}

export default Navigation;
