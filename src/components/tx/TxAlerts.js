import React, { useState, useEffect } from 'react';


const TxAlerts = (props) => {
  const [tx, setTx] = useState(props.tx);

  useEffect(() => {
    setTx({context: 'This is the 1,000,000th transaction.'});
  }, [props.tx]);

  const defaultAlert = () => {
    if (!tx.context) {
      return null;
    }

    return (
      <div className="alert alert-info backup-alert" role="alert">
        {tx.context}
      </div>
    )
  }

  return (
    <>
      {defaultAlert()}
    </>
  );
}

export default TxAlerts;
