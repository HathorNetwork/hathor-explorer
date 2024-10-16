/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import Version from './Version';
import { ReactComponent as NewLogo } from '../assets/images/new-logo.svg';

function Footer() {
  const theme = useSelector(state => state.theme);

  return (
    <footer className="footer-container">
      <div className="info-container">
        <div className="logo-version-container">
          <div className="d-flex flex-column align-items-center">
            <NewLogo
              className={`newLogo ${theme === 'dark' ? 'dark-theme-logo' : 'light-theme-logo'}`}
            />
          </div>
          <div className="hide-version">
            <Version />
          </div>
        </div>
        <div className="links-container">
          <button
            className="footer-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={() => window.open('https://hathor.network/developers/#hathor-documentation')}
          >
            <span className="footer-title">Developer Docs</span>
          </button>
          <button
            className="footer-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={() => window.open('https://github.com/hathornetwork')}
          >
            <span className="footer-title">Git Hub</span>
          </button>
          <button
            className="footer-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={() => window.open('https://hathor.network/developers/#try-it-out-now')}
          >
            <span className="footer-title">Download Wallet</span>
          </button>
        </div>
        <div className="terms-container">
          <button
            className="footer-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={() => window.open('https://hathor.network/privacy-policy/')}
          >
            <span className="footer-title">Privacy Policy</span>
          </button>
          <button
            className="footer-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={() => window.open('https://hathor.network/terms-and-conditions/')}
          >
            <span className="footer-title">Terms of Service</span>
          </button>
        </div>
      </div>
      <div className="rights-reserved">
        <span>Hathor Network © 2024 All Rights Reserved</span>
      </div>
    </footer>
  );
}

export default Footer;
