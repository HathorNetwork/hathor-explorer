import React, { useState, useEffect } from 'react';
import TagManager from 'react-gtm-module';
import helpers from '../../utils/helpers';
import { NFT_MEDIA_TYPES, VIDEO_MEDIA_TYPES_BY_EXTENSION, AUDIO_MEDIA_TYPES_BY_EXTENSION } from '../../constants';

const TokenNFTPreview = (props) => {
  const [token, setToken] = useState(props.token);

  useEffect(() => {
    // ensure data binding with props.token re rendering when changed
    setToken(props.token);
    if (token.uid) {
      TagManager.dataLayer({
        dataLayer: {
          event: 'LoadNFTPreview',
          tokenId: token.uid
        }
      });
    }
  }, [props.token, token.uid]);

  if (!token.meta || !token.meta.data.nft_media) {
    return null;
  }

  const onPlayMedia = () => {
    TagManager.dataLayer({
      dataLayer: {
        event: 'PlayNFTMedia',
        tokenId: token.uid
      }
    });
  }

  const nftType = token.meta.data.nft_media.type && token.meta.data.nft_media.type.toUpperCase();

  const ext = helpers.getFileExtension(token.meta.data.nft_media.file);

  let fileType;

  if (nftType === NFT_MEDIA_TYPES.audio) {
    fileType = AUDIO_MEDIA_TYPES_BY_EXTENSION[ext];
  }

  if (nftType === NFT_MEDIA_TYPES.video) {
    fileType = VIDEO_MEDIA_TYPES_BY_EXTENSION[ext];
  }

  let media;

  if (nftType === NFT_MEDIA_TYPES.image) {
    media = <img src={token.meta.data.nft_media.file} width="100%" height="100%" alt="NFT Preview" />;
  } else if(nftType === NFT_MEDIA_TYPES.video && fileType) {
    media = (
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onPlay={onPlayMedia}
        loop={token.meta.data.nft_media.loop}
        autoPlay={token.meta.data.nft_media.autoplay}
      >
        <source src={token.meta.data.nft_media.file} type={fileType} />
        Your browser does not support html video tag.
      </video>
    )
  } else if(nftType === NFT_MEDIA_TYPES.audio && fileType) {
    media = (
      <audio
        controls
        controlsList="nodownload"
        onPlay={onPlayMedia}
        loop={token.meta.data.nft_media.loop}
        autoPlay={token.meta.data.nft_media.autoplay}
      >
        <source src={token.meta.data.nft_media.file} type={fileType} />
        Your browser does not support the audio element.
      </audio>
    )
  } else {
    media = <p> Preview Unavailable </p>
  }

  return (
    <div className="d-flex flex-column token-nft-preview">
      <p><strong>NFT preview</strong></p>
      <figure className="figure flex-fill p-4 d-flex align-items-center justify-content-center">
        { media }
      </figure>
    </div>        
  );
}

export default TokenNFTPreview;
