/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useEffect } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useSelector } from 'react-redux';
import { NavLink, Link, useHistory } from 'react-router-dom';
import {
  REACT_APP_NETWORK,
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
} from '../constants';
import ConditionalNavigation from './ConditionalNavigation';
import Version from './Version';
import { ThemeSwitch } from './ThemeSwitch';
import { ReactComponent as SidebarLogo } from '../assets/images/logo-sidebar.svg';
import { ReactComponent as SunIconLight } from '../assets/images/sun-light.svg';
import { ReactComponent as SunIconDark } from '../assets/images/sun-dark.svg';
import { ReactComponent as MoonIcon } from '../assets/images/moon.svg';
import { ReactComponent as GlobeNetwork } from '../assets/images/global.svg';
import { ReactComponent as ArrorDownNavItem } from '../assets/images/arrow-down-nav-dropdown.svg';

function Sidebar({ close, open }) {
  const history = useHistory();
  const isTokensBaseEnabled = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`);
  const isTokensBalanceEnabled = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  const showTokensTab = isTokensBalanceEnabled || isTokensBaseEnabled;
  const theme = useSelector(state => state.theme);
  const sidebarRef = useRef(null);
  const hathorNetwork = `Hathor ${REACT_APP_NETWORK}`;

  useEffect(() => {
    const handleClickOutside = event => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [close]);

  return (
    <>
      <div
        className="sidebar-background-container"
        style={{ visibility: open ? 'visible' : 'hidden' }}
      >
        {' '}
      </div>
      <aside ref={sidebarRef} className={`sidebar  ${open ? 'active' : 'inactive'}`}>
        <div className="aside-explore-container">
          <div className="newLogo-explorer-container">
            <div className="d-flex flex-column align-items-center">
              <Link className="aside-brand" to="/" href="/">
                <SidebarLogo fill={theme === 'dark' ? 'white' : 'black'} className={`newLogo`} />
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
              onClick={() => history.push('/')}
            >
              <span>EXPLORER</span>
            </button>
          </div>
          <div className="aside-tabs-container">
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
                <span className="nav-item dropdown">
                  <span
                    className="nav-link dropdown-toggle"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Tokens
                    <ArrorDownNavItem style={{ marginLeft: '5px' }} className="dropdown-icon" />
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
                </span>
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
                  Tools <ArrorDownNavItem style={{ marginLeft: '5px' }} className="dropdown-icon" />
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
          </div>
        </div>
        <div className="aside-bottom-container">
          <div className="aside-theme-color-container">
            <div className="aside-theme-color-switch">
              {theme === 'dark' ? <SunIconDark /> : <SunIconLight />}
              <ThemeSwitch />
              <MoonIcon fill={theme === 'dark' ? 'white' : 'black'} />
            </div>
          </div>
          <div className="aside-network">
            <GlobeNetwork
              width={11}
              height={11}
              className={`${
                theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'
              } theme-network-logo`}
            />
            <span className="nav-title">{hathorNetwork}</span>
          </div>
          <div className="aside-version">
            <Version explorer />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
