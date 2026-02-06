/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useEffect } from 'react';
import { tokenBannedMessage } from '../../messages';
import { ReactComponent as AlertIcon } from '../../assets/images/alert-warning-icon.svg';

const TokenAlerts = props => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const bannedAlert = () => {
    if (!token.meta || !token.meta.banned) {
      return null;
    }

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle me-2" title="Banned Token"></i>
        {tokenBannedMessage}
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <>
        <div className="new-alert-warning" role="alert">
          <div>
            <AlertIcon className="alert-icon" />
          </div>

          <p>
            Only the UID is unique, there might be more than one token with the same name and
            symbol.
          </p>
        </div>
        {bannedAlert()}
      </>
    );
  };

  return renderNewUi();
};

export default TokenAlerts;
