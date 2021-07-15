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
        <i className="fa fa-certificate fa-lg text-info" title="Verified"></i>
        <span className="subtitle info-hover-popover">
          This is a verified token. <a href="http://google.com" >Learn more.</a>
        </span>
      </button>
    )
  }

  const bannedMarker = () => {
    if (!token.banned) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link pl-2">
        <i className="fa fa-exclamation-triangle fa-lg text-danger" title="Banned"></i>
        <span className="subtitle info-hover-popover">
          This token was banned and should not be trusted. <a href="http://google.com" >Learn more.</a>
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
