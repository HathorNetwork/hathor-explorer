import { useState, useEffect } from 'react';
import TokenMarkers from './TokenMarkers';

const TokenTitle = props => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const bannedClassName = () => {
    if (!token.meta || !token.meta.banned) {
      return '';
    }

    return 'text-danger';
  };

  return (
    <>
      <strong className={bannedClassName()}>
        {token.name} ({token.symbol})
      </strong>
      <TokenMarkers token={token} />
    </>
  );
};

export default TokenTitle;
