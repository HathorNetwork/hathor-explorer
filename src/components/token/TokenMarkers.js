import { useState, useEffect } from 'react';
// import { tokenBannedMessage } from '../../messages';

const TokenMarkers = props => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const verifiedMarker = () => {
    if (!token.meta || !token.meta.verified) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link ps-2">
        <i className="fa fa-check-circle fa-lg text-info" title="Verified"></i>
        <span className="subtitle info-hover-popover">
          This is a verified token. <a href="https://hathor.network">Learn more.</a>
        </span>
      </button>
    );
  };

  const bannedMarker = () => {
    if (!token.meta || !token.meta.banned) {
      return null;
    }
    let banIcon = <i className="fa fa-exclamation-triangle fa-lg text-danger" title="Banned"></i>;
    if (token.meta.reason) {
      banIcon = (
        <div>
          <i className="fa fa-exclamation-triangle fa-lg text-danger"></i>
          <span className="subtitle info-hover-popover">{token.meta.reason}</span>
        </div>
      );
    }

    return <button className="info-hover-wrapper btn btn-link ps-2">{banIcon}</button>;
  };

  return (
    <>
      {verifiedMarker()}
      {bannedMarker()}
    </>
  );
};

export default TokenMarkers;
