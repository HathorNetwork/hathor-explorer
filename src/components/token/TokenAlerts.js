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

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle mr-2" title="Token Verified"></i>
        This token was banned and should not be trusted. <a href="http://hathor.network" >Learn more.</a>
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
