import { useState, useEffect } from 'react';

const TxMarkers = props => {
  const [tx, setTx] = useState(props.tx);

  useEffect(() => {
    setTx(props.tx);
  }, [props.tx]);

  const genesisMarker = () => {
    if (!tx.meta || !tx.meta.genesis) {
      return null;
    }

    return <span className="text-info">[GENESIS]</span>;
  };

  const infoMarker = () => {
    if (!tx.meta || !tx.meta.context) {
      return null;
    }

    return (
      <button className="info-hover-wrapper btn btn-link ps-1">
        <i className="fa fa-certificate text-info" title={tx.meta.context}></i>
        <span className="subtitle info-hover-popover">{tx.meta.context}</span>
      </button>
    );
  };

  return (
    <>
      {genesisMarker()}
      {infoMarker()}
    </>
  );
};

export default TxMarkers;
