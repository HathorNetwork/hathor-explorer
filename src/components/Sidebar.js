/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
  UNLEASH_TOKENS_BASE_FEATURE_FLAG,
  UNLEASH_TOKEN_BALANCES_FEATURE_FLAG,
} from '../constants';
import ConditionalNavigation from './ConditionalNavigation';
import { ThemeSwitch } from './ThemeSwitch';
import { ReactComponent as SunIconLight } from '../assets/images/sun-light.svg';
import { ReactComponent as SunIconDark } from '../assets/images/sun-dark.svg';
import { ReactComponent as MoonIcon } from '../assets/images/moon.svg';
import { ReactComponent as ArrorDownNavItem } from '../assets/images/arrow-down-nav-dropdown.svg';

function Sidebar({ close, open }) {
  const isTokensBaseEnabled = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.rollout`);
  const isTokensBalanceEnabled = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.rollout`);
  const showTokensTab = isTokensBalanceEnabled || isTokensBaseEnabled;
  const { serverInfo, theme } = useSelector(state => {
    return {
      serverInfo: state.serverInfo,
      theme: state.theme,
    };
  });
  const sidebarRef = useRef(null);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [nanoOpen, setNanoOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

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
          <div className="aside-tabs-container">
            <ul className="navbar-nav me-auto">
              <li className="nav-item item-sidebar">
                <NavLink
                  to="/"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Home
                </NavLink>
              </li>
              {showTokensTab && (
                <span className="dropdown-sidebar">
                  <span
                    className="nav-link dropdown-toggle"
                    onClick={() => setTokensOpen(!tokensOpen)}
                  >
                    Tokens
                    <ArrorDownNavItem
                      style={{ marginLeft: '5px', rotate: tokensOpen ? '180deg' : '0deg' }}
                      className="dropdown-icon"
                    />
                  </span>
                  {tokensOpen && (
                    <div>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
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
                      </ul>
                    </div>
                  )}
                </span>
              )}
              {serverInfo.nano_contracts_enabled && (
                <li className="nav-item item-sidebar">
                  <span onClick={() => setNanoOpen(!nanoOpen)}>
                    Nano{' '}
                    <ArrorDownNavItem
                      style={{ marginLeft: '5px', rotate: toolsOpen ? '180deg' : '0deg' }}
                      className="dropdown-icon"
                    />
                  </span>
                  {nanoOpen && (
                    <div>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        <li>
                          <NavLink to="/nano_contracts/" exact className="nav-link">
                            Nano Conctracts List
                          </NavLink>
                          <NavLink to="/blueprints/?type=built-in" exact className="nav-link">
                            Blueprints List
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
              )}
              <li className="nav-item item-sidebar">
                <NavLink
                  to="/network"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Network
                </NavLink>
              </li>
              <li className="nav-item item-sidebar">
                <NavLink
                  to="/statistics"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Statistics
                </NavLink>
              </li>
              <li className="nav-item item-sidebar">
                <span onClick={() => setToolsOpen(!toolsOpen)}>
                  Tools{' '}
                  <ArrorDownNavItem
                    style={{ marginLeft: '5px', rotate: toolsOpen ? '180deg' : '0deg' }}
                    className="dropdown-icon"
                  />
                </span>
                {toolsOpen && (
                  <div>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                      <li>
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
                      </li>
                    </ul>
                  </div>
                )}
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
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
