import React, { useState, useEffect } from 'react';
import { tokenBannedMessage } from '../../messages';


const TokenAlerts = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const bannedAlert = () => {
    if (!token.meta || !token.meta.data.banned) {
      return null;
    }

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle mr-2" title="Banned Token"></i>
          {tokenBannedMessage}
      </div>
    )
  }

  return (
    <>
      <div className="alert alert-warning backup-alert" role="alert">
        Only the UID is unique, there might be more than one token with the same name and symbol.
      </div>
      {bannedAlert()}
    </>
  );
}

export default TokenAlerts;
