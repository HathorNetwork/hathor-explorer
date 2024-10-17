/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import CookieConsent from 'react-cookie-consent';
import TagManager from 'react-gtm-module';
import { GTM_ID } from '../constants';
import { useNewUiEnabled } from '../hooks';

const GDPRConsent = () => {
  const newUiEnabled = useNewUiEnabled();

  const newUiStyle = {
    maxWidth: '718px',
    width: '95%',
    borderRadius: '8px',
    backgroundColor: '#4E667499',
    fontFamily: 'Mona Sans',
    color: '#191C21',
    fontSize: '14px',
    lineHeight: '20px',
    textAlign: 'left',
    position: 'fixed',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    flexWrap: 'nowrap',
    gap: '0px',
    boxSizing: 'border-box',
  };

  useEffect(() => {
    // Just to ensure that when we initialize GTM, the message on this component will be shown
    TagManager.initialize({ gtmId: GTM_ID });
    // To inicialize something the user already consented, we can use getCookieConsentValue method and test the returned value ('true' or 'false') here
  }, []);

  const renderNewUi = () => {
    return (
      <CookieConsent
        style={newUiStyle}
        disableButtonStyles={true}
        buttonText="Got it!"
        buttonWrapperClasses="mx-auto"
        buttonClasses="btn btn-hathor m-3"
      >
        This website uses cookies to ensure you get the best experience on our website.
        <a
          style={{ fontWeight: 'bold', color: '#191C21', textDecoration: 'underline' }}
          href="https://hathor.network/terms-and-conditions/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
        .
      </CookieConsent>
    );
  };

  const renderUi = () => {
    return (
      <CookieConsent
        disableButtonStyles={true}
        buttonText="Got it!"
        buttonWrapperClasses="mx-auto"
        buttonClasses="btn btn-hathor m-3"
      >
        This website uses cookies to ensure you get the best experience on our website.
        <a
          href="https://hathor.network/terms-and-conditions/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
        .
      </CookieConsent>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default GDPRConsent;
