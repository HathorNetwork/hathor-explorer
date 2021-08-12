import React, { useState, useEffect } from 'react';
import { txTokenBannedMessage } from '../../messages';


const TxAlerts = (props) => {
  const [transaction, setTransaction] = useState(props.transaction);

  useEffect(() => {
    setTransaction(props.transaction);
  }, [props.transaction]);

  const bannedAlert = () => {
    if (!transaction.tokens.find(token => token.meta && token.meta.data.banned)) {
      return null;
    }

    return (
      <div className="alert alert-danger backup-alert" role="alert">
        <i className="fa fa-exclamation-triangle mr-2" title="Transaction from a Banned Token"></i>
          {txTokenBannedMessage}
      </div>
    )
  }

  return (
    <>
      {bannedAlert()}
    </>
  );
}

export default TxAlerts;
