import React, { useState, useEffect } from 'react';
import TagManager from 'react-gtm-module';
import helpers from '../../utils/helpers';
import {
  NFT_MEDIA_TYPES,
  VIDEO_MEDIA_TYPES_BY_EXTENSION,
  AUDIO_MEDIA_TYPES_BY_EXTENSION,
} from '../../constants';
import { useNewUiEnabled } from '../../hooks';

const TokenNFTPreview = props => {
  const [token, setToken] = useState(props.token);
  const isNewUiEnabled = useNewUiEnabled();

  useEffect(() => {
    // ensure data binding with props.token re rendering when changed
    setToken(props.token);
    if (token.uid) {
      TagManager.dataLayer({
        dataLayer: {
          event: 'LoadNFTPreview',
          tokenId: token.uid,
        },
      });
    }
  }, [props.token, token.uid]);

  if (!token.meta || !token.meta.nft_media) {
    return null;
  }

  const onPlayMedia = () => {
    TagManager.dataLayer({
      dataLayer: {
        event: 'PlayNFTMedia',
        tokenId: token.uid,
      },
    });
  };

  const nftType = token.meta.nft_media.type && token.meta.nft_media.type.toUpperCase();

  // The metadata may have the media mime type (useful for videos and audios) because many times the file does not have an extension.
  // In case it's not there, we try to get from the file extension
  // mimeType will already have image/png, video/mp4, application/pdf, audio/mp3
  // so we don't need to handle anything if it's already set
  const mimeType = token.meta.nft_media.mime_type;

  let fileType = mimeType;
  if (!fileType) {
    const ext = helpers.getFileExtension(token.meta.nft_media.file);

    if (nftType === NFT_MEDIA_TYPES.audio) {
      fileType = AUDIO_MEDIA_TYPES_BY_EXTENSION[ext];
    }

    if (nftType === NFT_MEDIA_TYPES.video) {
      fileType = VIDEO_MEDIA_TYPES_BY_EXTENSION[ext];
    }
  }

  let media;

  if (nftType === NFT_MEDIA_TYPES.image) {
    media = <img src={token.meta.nft_media.file} width="100%" height="100%" alt="NFT Preview" />;
  } else if (nftType === NFT_MEDIA_TYPES.video && fileType) {
    media = (
      <video
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onPlay={onPlayMedia}
        loop={token.meta.nft_media.loop}
        autoPlay={token.meta.nft_media.autoplay}
      >
        <source src={token.meta.nft_media.file} type={fileType} />
        Your browser does not support html video tag.
      </video>
    );
  } else if (nftType === NFT_MEDIA_TYPES.audio && fileType) {
    media = (
      <audio
        controls
        controlsList="nodownload"
        onPlay={onPlayMedia}
        loop={token.meta.nft_media.loop}
        autoPlay={token.meta.nft_media.autoplay}
      >
        <source src={token.meta.nft_media.file} type={fileType} />
        Your browser does not support the audio element.
      </audio>
    );
  } else if (nftType === NFT_MEDIA_TYPES.pdf) {
    // Toolbar to prevent showing download/print icons
    const data = `${token.meta.nft_media.file}#toolbar=0`;
    media = (
      <object
        data={data}
        width="100%"
        height="100%"
        type="application/pdf"
        alt="NFT Preview"
        aria-label="NFT Preview"
      />
    );
  } else {
    media = <p> Preview Unavailable </p>;
  }

  if (isNewUiEnabled) {
    return (
      <div className="token-nft-preview">
        <p>
          <strong>NFT PREVIEW</strong>
        </p>
        <figure className="figure flex-fill p-4 d-flex align-items-center justify-content-center">
          {media}
        </figure>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column token-nft-preview">
      <p>
        <strong>NFT preview</strong>
      </p>
      <figure className="figure flex-fill p-4 d-flex align-items-center justify-content-center">
        {media}
      </figure>
    </div>
  );
};

export default TokenNFTPreview;
