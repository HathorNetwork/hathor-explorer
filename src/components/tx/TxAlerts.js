import React, { useState, useEffect } from 'react';
import { txTokenBannedMessage } from '../../messages';

const TxAlerts = props => {
  const [tokens, setTokens] = useState(props.tokens);

  useEffect(() => {
    setTokens(props.tokens);
  }, [props.tokens]);

  const bannedAlert = () => {
    if (!tokens.find(token => token.meta && token.meta.banned)) {
      return null;
    }

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle me-2" title="Transaction from a Banned Token"></i>
        {txTokenBannedMessage}
      </div>
    );
  };

  return <>{bannedAlert()}</>;
};

export default TxAlerts;
