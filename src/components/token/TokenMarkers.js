import React, { useState, useEffect } from 'react';
import { tokenBannedMessage } from '../../messages';


const TokenMarkers = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const verifiedMarker = () => {
    if (!token.meta || !token.meta.data.verified) {
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
    if (!token.meta || !token.meta.data.banned) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link pl-2">
        <i className="fa fa-exclamation-triangle fa-lg text-danger" title="Banned"></i>
        <span className="subtitle info-hover-popover">
          {tokenBannedMessage}
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
