/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import { GTM_ID } from '../constants';
import CookieConsent, { getCookieConsentValue }  from "react-cookie-consent";
import TagManager from 'react-gtm-module';


const GDPRConsent = () => {
  
  const onAccept = () => {
    // Nothing yet
  };
  
  useEffect(() => {
    // Just to ensure that when we initialize GTM, the message on this component will be shown
    TagManager.initialize({ gtmId: GTM_ID });

    const isConsent = getCookieConsentValue();
    if (isConsent === "true") {
      onAccept();
    }
  }, []);

  return (
    <CookieConsent
      onAccept={onAccept}
      disableButtonStyles={true}
      buttonText="Got it!"
      buttonWrapperClasses="mx-auto"
      buttonClasses="btn btn-hathor m-3"
    >
      We use cookies to improve your user experience. By continuing onto our website, you agree with our
      <a href="https://hathor.network/terms-and-conditions/" target="_blank" rel="noopener noreferrer" > Terms and Conditions </a>.
    </CookieConsent>
  )
}

export default GDPRConsent;
