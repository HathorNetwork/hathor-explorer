/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import { GTM_ID } from '../constants';
import CookieConsent from "react-cookie-consent";
import TagManager from 'react-gtm-module';


const GDPRConsent = () => {

  useEffect(() => {
    // Just to ensure that when we initialize GTM, the message on this component will be shown
    TagManager.initialize({ gtmId: GTM_ID });
    // To inicialize something the user already consented, we can use getCookieConsentValue method and test the returned value ('true' or 'false') here
  }, []);

  return (
    <CookieConsent
      disableButtonStyles={true}
      buttonText="Got it!"
      buttonWrapperClasses="mx-auto"
      buttonClasses="btn btn-hathor m-3"
    >
      This website uses cookies to ensure you get the best experience on our website.
      <a href="https://hathor.network/terms-and-conditions/" target="_blank" rel="noopener noreferrer" > Learn more</a>.
    </CookieConsent>
  )
}

export default GDPRConsent;
