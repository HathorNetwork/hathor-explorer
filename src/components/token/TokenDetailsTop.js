import React, { useState, useEffect } from 'react';
import TokenConfig from './TokenConfig';
import TokenInfo from './TokenInfo';
import TokenTitle from './TokenTitle';
import TokenNFTPreview from './TokenNFTPreview';
import TokenAlerts from './TokenAlerts';

const TokenDetailsTop = props => {
  const [token, setToken] = useState(props.token);
  const [metadataLoaded, setMetadataLoaded] = useState(props.metadataLoaded);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  useEffect(() => {
    setMetadataLoaded(props.metadataLoaded);
  }, [props.metadataLoaded]);

  const nftPreview = () => {
    if (!token.meta || !token.meta.nft || !token.meta.nft_media) {
      return null;
    }

    return (
      <div className="d-flex align-items-lg-stretch mt-4 mt-lg-0">
        <TokenNFTPreview token={token} />
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <>
        <div className="d-flex flex-column justify-content-between mt-4 mb-3">
          <p className="token-name mb-0 mt-4">
            <TokenTitle token={token} />
          </p>
        </div>
        <TokenAlerts token={token} />
        <div className="token-medium-containers">
          <div className="d-flex flex-column justify-content-between">
            <TokenInfo token={token} metadataLoaded={metadataLoaded} />
          </div>
          <div className="d-flex align-items-lg-stretch mt-4 mt-lg-0">
            <TokenConfig token={token} />
          </div>
          {nftPreview()}
        </div>
      </>
    );
  };

  return renderNewUi();
};

export default TokenDetailsTop;
