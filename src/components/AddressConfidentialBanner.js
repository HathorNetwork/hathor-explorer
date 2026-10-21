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
 * is no public summary or history below to refer to. With
 * `hasHiddenTokenActivity` the transactions that hide their token are listed
 * under "Confidential tokens".
 */
function subtitle(confidentialOnly, hasHiddenTokenActivity) {
  if (confidentialOnly) {
    return hasHiddenTokenActivity
      ? 'Its transactions hide their tokens and amounts, so only the transactions are listed below.'
      : 'It has no public balance or history to display. Confidential amounts are not shown.';
  }
  const publicOnly =
    'Only public balances and tokens are displayed below. Confidential amounts sent to or from this address are not included.';
  return hasHiddenTokenActivity
    ? `${publicOnly} Transactions that hide their token are listed under Confidential tokens.`
    : publicOnly;
}

function AddressConfidentialBanner({ confidentialOnly, hasHiddenTokenActivity }) {
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
          {subtitle(confidentialOnly, hasHiddenTokenActivity)}
        </div>
      </div>
    </div>
  );
}

AddressConfidentialBanner.propTypes = {
  confidentialOnly: PropTypes.bool,
  hasHiddenTokenActivity: PropTypes.bool,
};

AddressConfidentialBanner.defaultProps = {
  confidentialOnly: false,
  hasHiddenTokenActivity: false,
};

export default AddressConfidentialBanner;
