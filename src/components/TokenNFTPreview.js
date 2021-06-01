import React, { useState, useEffect } from 'react';

const TokenNFTPreview = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  if (!token.meta.nft) {
    return null;
  }

  let media;

  if (token.meta.nft.type === 'image') {
    media = <img src={token.meta.nft.file} width="100%" height="100%" alt="NFT Preview" />;
  } else {
    media = (
      <video controls controlsList="nodownload noremoteplayback" disablePictureInPicture>
        <source src={token.meta.nft.file} type="video/mp4" />
        Your browser does not support html video tag.
      </video>
    )
  }

  return (
    <div className="d-flex flex-column token-nft-preview">
      <p><strong>NFT preview</strong></p>
      <figure class="figure flex-fill p-4 d-flex align-items-center justify-content-center">
        { media }
      </figure>
    </div>        
  );
}

export default TokenNFTPreview;
