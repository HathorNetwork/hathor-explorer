import React, { useState, useEffect } from 'react';


const TokenMarkers = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const verifiedMarker = () => {
    if (!token.verified) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link pl-2">
        <i className="fa fa-check-circle fa-lg text-info" title="Verified"></i>
        <span className="subtitle info-hover-popover">
          This is a verified token. <a href="https://hathor.network" >Learn more.</a>
        </span>
      </button>
    )
  }

  const bannedMarker = () => {
    if (!token.banned) {
      return null;
    }

    const bannedMessage = ''; // TODO: this message is being disscussed here: https://github.com/HathorNetwork/hathor-explorer/issues/92

    return (
      <button className="info-hover-wrapper btn btn-link pl-2">
        <i className="fa fa-exclamation-triangle fa-lg text-danger" title="Banned"></i>
        <span className="subtitle info-hover-popover">
          {bannedMessage}
        </span>
      </button>
    )
  }

  return (
    <>
      {verifiedMarker()}
      {bannedMarker()}
    </>
  );
}

export default TokenMarkers;
