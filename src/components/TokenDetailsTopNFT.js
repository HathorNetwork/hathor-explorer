import React, { useState, useEffect } from 'react';
import TokenConfig from '../components/TokenConfig';
import TokenInfo from '../components/TokenInfo';
import TokenNFTPreview from '../components/TokenNFTPreview';

const TokenDetailsTopNFT = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  return (
    <>
      <div className='d-flex flex-column justify-content-between mt-4 mb-3'>
        <p className='token-name mb-0 mt-4'>
          <strong>{token.name} ({token.symbol})</strong>
        </p>
      </div>
      <div className='d-flex flex-column flex-lg-row align-items-lg-stretch align-items-center justify-content-between mb-4'>
        <div className='d-flex flex-column justify-content-between'>
          <TokenInfo token={token} />
        </div>
        <div className='d-flex align-items-lg-stretch mt-4 mt-lg-0'>
          <TokenConfig token={token} />
        </div>
        <div className='d-flex align-items-lg-stretch mt-4 mt-lg-0'>
          <TokenNFTPreview token={token} />
        </div>
      </div>
    </>
  )

}

export default TokenDetailsTopNFT;
