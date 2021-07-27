import React, { useState, useEffect } from 'react';
import helpers from '../../utils/helpers';


const TxMarkers = (props) => {
  const [tx, setTx] = useState(props.tx);

  useEffect(() => {
    setTx({...props.tx, genesis: helpers.isGenesisBlock(props.tx.hash) || helpers.isGenesisTx(props.tx.hash)});
  }, [props.tx]);

  const genesisMarker = () => {
    if (!tx.genesis) {
      return null;
    }

    return (
      <span className="text-info">[GENESIS]</span>
    )
  }

  const infoMarker = () => {
    if (!tx.context) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link pl-1">
        <i className="fa fa-certificate text-info" title={tx.context} ></i>
        <span className="subtitle info-hover-popover">
          {tx.context}
        </span>
      </button>
    )
  }

  return (
    <>
      {genesisMarker()}
      {infoMarker()}
    </>
  );
}

export default TxMarkers;
