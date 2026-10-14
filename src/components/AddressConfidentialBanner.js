/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ShieldIcon } from './ConfidentialBadge';

/**
 * Page-level banner shown above the address summary when the address has
 * confidential (shielded) activity. Copy mirrors the CTX Figma.
 *
 * With `confidentialOnly` the address has no public tokens at all, so there
 * is no summary or history below to refer to.
 */
function AddressConfidentialBanner({ confidentialOnly }) {
  return (
    <div className="address-confidential-banner" role="note">
      <ShieldIcon className="address-confidential-banner__icon" />
      <div className="address-confidential-banner__text">
        <div className="address-confidential-banner__title">
          {confidentialOnly
            ? 'This address only has confidential activity'
            : 'This address has confidential activity'}
        </div>
        <div className="address-confidential-banner__subtitle">
          {confidentialOnly
            ? 'Its amounts and tokens are confidential, so there is no public balance or history to display.'
            : 'Only public balances and tokens are displayed below. Additional confidential amounts exist on this address.'}
        </div>
      </div>
    </div>
  );
}

AddressConfidentialBanner.propTypes = {
  confidentialOnly: PropTypes.bool,
};

AddressConfidentialBanner.defaultProps = {
  confidentialOnly: false,
};

export default AddressConfidentialBanner;
