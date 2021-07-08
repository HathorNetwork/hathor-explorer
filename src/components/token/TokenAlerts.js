import React, { useState, useEffect } from 'react';


const TokenAlerts = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken({banned: true});
  }, [props.token]);

  const verifiedAlert = () => {
    if (!token.verified) {
      return null;
    }

    return (
      <div className="alert alert-info backup-alert" role="alert">
        <i className="fa fa-check-circle mr-2" title="Token Verified"></i> This token is verified by Hathor team.
      </div>
    )
  }

  const bannedAlert = () => {
    if (!token.banned) {
      return null;
    }

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle mr-2" title="Token Verified"></i> This token was marked as scam by Hathor team.
      </div>
    )
  }

  const defaultAlert = () => {
    if (token.verified || token.banned) {
      return null;
    }

    return (
      <div className="alert alert-warning backup-alert" role="alert">
        Only the UID is unique, there might be more than one token with the same name and symbol.
      </div>
    )
  }

  return (
    <>
      {bannedAlert()}
      {verifiedAlert()}
      {defaultAlert()}
    </>
  );
}

export default TokenAlerts;
