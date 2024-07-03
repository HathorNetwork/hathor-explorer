import React, { useState, useEffect } from 'react';
import helpers from '../../utils/helpers';
import { numberUtils, constants as hathorLibConstants } from '@hathor/wallet-lib';
import { connect } from 'react-redux';


const mapStateToProps = (state) => {
  return {
    decimalPlaces: state.serverInfo?.decimal_places ?? hathorLibConstants.DECIMAL_PLACES,
  }
}

const TokenInfo = (props) => {

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
  }

  // We show 'Loading' until all metadatas are loaded for type and supply
  // to prevent switching from decimal to integer (and the type) if one of the tokens is an NFT
  const getType = () => {
    if (!metadataLoaded) {
      return 'Loading...';
    }

    if (isNFT()) {
      return 'NFT';
    } else {
      return 'Custom token';
    }
  }

  const getTotalSupplyPretty = () => {
    if (!metadataLoaded) {
      return 'Loading...';
    }

    const amount = numberUtils.prettyValue(token.totalSupply, isNFT() ? 0 : props.decimalPlaces);
    return `${amount} ${token.symbol}`;
  }

  return (
    <div className="token-general-info">
      <p className="token-general-info__uid"><strong>UID: </strong><br/>{token.uid}</p>
      <p><strong>Type: </strong>{getType()}</p>
      <p><strong>Name: </strong>{token.name}</p>
      <p><strong>Symbol: </strong>{token.symbol}</p>
      <p><strong>Total supply: </strong>{getTotalSupplyPretty()}</p>
      <p>
        <strong>Can mint new tokens: </strong>
        {token.canMint ? 'Yes' : 'No'}
        <button className="info-hover-wrapper float-right btn btn-link">
          <i className="fa fa-info-circle" title="Mint info"></i>
          <span className="subtitle subtitle info-hover-popover">Indicates whether the token owner can create new tokens, increasing the total supply</span>
        </button>
      </p>
      <p>
        <strong>Can melt tokens: </strong>
        {token.canMelt ? 'Yes' : 'No'}
        <button className="info-hover-wrapper float-right btn btn-link">
          <i className="fa fa-info-circle" title="Melt info"></i>
          <span className="subtitle info-hover-popover">Indicates whether the token owner can destroy tokens, decreasing the total supply</span>
        </button>
      </p>
      <p><strong>Total number of transactions: </strong>{token.transactionsCount}</p>
    </div>
  )
}

export default connect(mapStateToProps)(TokenInfo);
