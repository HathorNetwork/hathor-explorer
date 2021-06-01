import React, { useState, useEffect } from 'react';
import hathorLib from '@hathor/wallet-lib';


const TokenInfo = (props) => {

  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  return (
    <div className="token-general-info">
      <p className="token-general-info__uid"><strong>UID: </strong><br/>{token.uid}</p>
      <p><strong>Name: </strong>{token.name}</p>
      <p><strong>Symbol: </strong>{token.symbol}</p>
      <p><strong>Total supply: </strong>{hathorLib.helpers.prettyValue(token.totalSupply)} {token.symbol}</p>
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

export default TokenInfo;
