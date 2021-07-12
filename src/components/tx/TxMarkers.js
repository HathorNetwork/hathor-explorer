import React, { useState, useEffect } from 'react';
import helpers from '../../utils/helpers';


const TxMarkers = (props) => {
  const [tx, setTx] = useState(props.tx);

  useEffect(() => {
    setTx({genesis: helpers.isGenesisBlock(props.tx.hash) || helpers.isGenesisTx(props.tx.hash)});
  }, [props.tx]);

  const genesisMarker = () => {
    if (!tx.genesis) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link pl-0">
        <i className="fa fa-certificate text-info" title="Genesis"></i>
        <span className="subtitle info-hover-popover">
          This is the first Network {helpers.isBlock(props.tx) ? 'Block' : 'Transaction'}
        </span>
      </button>
    )
  }

  return (
    <>
      {genesisMarker()}
    </>
  );
}

export default TxMarkers;
