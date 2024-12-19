import React, { useState, useEffect } from 'react';
import { numberUtils } from '@hathor/wallet-lib';
import { connect } from 'react-redux';
import { useNewUiEnabled } from '../../hooks';
import { ReactComponent as InfoIcon } from '../../assets/images/icon-info.svg';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

const TokenInfo = props => {
  const newUiEnabled = useNewUiEnabled();
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

  const renderUi = () => {
    return (
      <div className="token-general-info">
        <p className="token-general-info__uid">
          <strong>UID: </strong>
          <br />
          {token.uid}
        </p>
        <p>
          <strong>Type: </strong>
          {getType()}
        </p>
        <p>
          <strong>Name: </strong>
          {token.name}
        </p>
        <p>
          <strong>Symbol: </strong>
          {token.symbol}
        </p>
        <p>
          <strong>Total supply: </strong>
          {getTotalSupplyPretty()}
        </p>
        <p>
          <strong>Can mint new tokens: </strong>
          {token.canMint ? 'Yes' : 'No'}
          <button className="info-hover-wrapper float-right btn btn-link">
            <i className="fa fa-info-circle" title="Mint info"></i>
            <span className="subtitle subtitle info-hover-popover">
              Indicates whether the token owner can create new tokens, increasing the total supply
            </span>
          </button>
        </p>
        <p>
          <strong>Can melt tokens: </strong>
          {token.canMelt ? 'Yes' : 'No'}
          <button className="info-hover-wrapper float-right btn btn-link">
            <i className="fa fa-info-circle" title="Melt info"></i>
            <span className="subtitle info-hover-popover">
              Indicates whether the token owner can destroy tokens, decreasing the total supply
            </span>
          </button>
        </p>
        <p>
          <strong>Total number of transactions: </strong>
          {token.transactionsCount}
        </p>
      </div>
    );
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

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default connect(mapStateToProps)(TokenInfo);
