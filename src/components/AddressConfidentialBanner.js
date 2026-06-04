/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ShieldIcon } from './ConfidentialBadge';

/**
 * Page-level banner shown above the address summary when the address has
 * confidential (shielded) activity. Copy mirrors the CTX Figma.
 */
function AddressConfidentialBanner() {
  return (
    <div className="address-confidential-banner" role="note">
      <ShieldIcon className="address-confidential-banner__icon" />
      <div className="address-confidential-banner__text">
        <div className="address-confidential-banner__title">
          This address has confidential activity
        </div>
        <div className="address-confidential-banner__subtitle">
          Only public balances and tokens are displayed below. Additional confidential amounts exist
          on this address.
        </div>
      </div>
    </div>
  );
}

export default AddressConfidentialBanner;
