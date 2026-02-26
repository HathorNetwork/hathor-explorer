import React, { useState, useEffect } from 'react';
import { numberUtils, TokenVersion } from '@hathor/wallet-lib';
import { connect } from 'react-redux';
import { ReactComponent as InfoIcon } from '../../assets/images/icon-info.svg';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

const FeeModel = ({ token }) => {
  const modelMap = {
    [TokenVersion.DEPOSIT]: {
      label: 'Deposit-based',
      tooltip: 'Deposit-based tokens are feeless',
    },
    [TokenVersion.FEE]: {
      label: 'Fee-based',
      tooltip: 'Fee-based tokens require a small fee in HTR',
    },
  };

  const model = modelMap[token.version];
  if (!model) {
    return null;
  }

  return (
    <div>
      <span>FEE MODEL</span>
      <span className="info-tooltip-container">
        <div style={{ whiteSpace: 'nowrap' }}>{model.label}</div>
        <div className="tooltip-info-icon">
          <InfoIcon />
          <span className="info-tooltip">{model.tooltip}</span>
        </div>
      </span>
    </div>
  );
};

const TokenInfo = props => {
  const [token, setToken] = useState(props.token);
  const [metadataLoaded, setMetadataLoaded] = useState(props.metadataLoaded);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  useEffect(() => {
    setMetadataLoaded(props.metadataLoaded);
  }, [props.metadataLoaded]);

  const isNFT = () => {
    return token.meta && token.meta.nft;
  };

  // We show 'Loading' until all metadatas are loaded for type and supply
  // to prevent switching from decimal to integer (and the type) if one of the tokens is an NFT
  const getType = () => {
    if (!metadataLoaded) {
      return 'Loading...';
    }

    if (isNFT()) {
      return 'NFT';
    }
    return 'Custom token';
  };

  const getTotalSupplyPretty = () => {
    if (!metadataLoaded) {
      return 'Loading...';
    }

    const amount = numberUtils.prettyValue(token.totalSupply, isNFT() ? 0 : props.decimalPlaces);
    return `${amount} ${token.symbol}`;
  };

  const renderNewUi = () => {
    return (
      <div className="token-new-general-info">
        <h2>Overview</h2>
        <div>
          <span>UID</span>
          <span>{token.uid}</span>
        </div>
        <div>
          <span>TYPE</span>
          <span>{getType()}</span>
        </div>
        <div>
          <span>NAME</span>
          <span>{token.name}</span>
        </div>
        <div>
          <span>SYMBOL</span>
          <span>{token.symbol}</span>
        </div>
        <FeeModel token={token} />
        <div>
          <span>TOTAL SUPPLY</span>
          <span>{getTotalSupplyPretty()}</span>
        </div>
        <div>
          <span>
            CAN MINT NEW
            <br />
            TOKENS
          </span>
          <span className="info-tooltip-container">
            <div style={{ whiteSpace: 'nowrap' }}>{token.canMint ? 'Yes' : 'No'}</div>
            <div className="tooltip-info-icon">
              <InfoIcon />
              <span className="info-tooltip">
                Indicates whether the token owner can create new tokens, increasing the total
                supply.
              </span>
            </div>
          </span>
        </div>
        <div>
          <span>
            CAN MELT
            <br />
            TOKENS
          </span>
          <span className="info-tooltip-container">
            <div style={{ whiteSpace: 'nowrap' }}>{token.canMelt ? 'Yes' : 'No'}</div>
            <div className="tooltip-info-icon">
              <InfoIcon />
              <span className="info-tooltip">
                Indicates whether the token owner can destroy tokens, decreasing the total supply.
              </span>
            </div>
          </span>
        </div>
        <div>
          <span>
            TOTAL NUMBER
            <br />
            OF TX
          </span>
          <span>{token.transactionsCount}</span>
        </div>
      </div>
    );
  };

  return renderNewUi();
};

export default connect(mapStateToProps)(TokenInfo);
