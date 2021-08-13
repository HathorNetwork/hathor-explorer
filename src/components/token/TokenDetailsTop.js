import React, { useState, useEffect } from 'react';
import TokenConfig from './TokenConfig';
import TokenInfo from './TokenInfo';
import TokenTitle from './TokenTitle';


const TokenDetailsTop = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  return (
    <>
      <div className='d-flex flex-column justify-content-between mt-4 mb-3'>
        <p className='token-name mb-0 mt-4'>
          <TokenTitle token={token} />
        </p>
      </div>
      <div className='d-flex flex-column flex-lg-row align-items-lg-stretch align-items-center justify-content-between mb-4'>
        <div className='d-flex flex-column justify-content-between'>
          <TokenInfo token={token} />
        </div>
        <div className='d-flex align-items-lg-stretch mt-4 mt-lg-0'>
          <TokenConfig token={token} />
        </div>
      </div>
    </>
  )

}

export default TokenDetailsTop;
