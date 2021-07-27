import React, { useState, useEffect } from 'react';


const TokenAlerts = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const bannedAlert = () => {
    if (!token.banned) {
      return null;
    }

    const bannedMessage = ''; // TODO: this message is being disscussed here: https://github.com/HathorNetwork/hathor-explorer/issues/92

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle mr-2" title="Banned Token"></i>
          {bannedMessage}
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
