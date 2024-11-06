/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import hathorLib from '@hathor/wallet-lib';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import NewHathorAlert from '../NewHathorAlert';
import { useNewUiEnabled } from '../../hooks';
import { ReactComponent as CopyIcon } from '../../assets/images/copy-icon.svg';
import { ReactComponent as DownloadIcon } from '../../assets/images/download-icon.svg';

const TokenConfig = props => {
  const newUiEnabled = useNewUiEnabled();
  const [token, setToken] = useState(props.token);
  const [successMessage, setSuccessMessage] = useState('');
  const configurationString = hathorLib.tokensUtils.getConfigurationString(
    token.uid,
    token.name,
    token.symbol
  );
  const alertSuccess = useRef(null);

  useEffect(() => {
    setToken(props.token);
  }, [props.token]);

  const getShortConfigurationString = () => {
    const configArr = configurationString.split(':');
    return `${configArr[0]}:${configArr[1]}...${configArr[3]}`;
  };

  /**
   * Show alert success message
   *
   * @param {string} message Success message
   */
  const showSuccess = message => {
    setSuccessMessage(message);
    alertSuccess.current.show(3000); // Call show method on NewHathorAlert with duration
  };

  /**
   * Called when user clicks to download the qrcode
   * Add the href from the qrcode canvas
   *
   * @param {Object} e Event emitted by the link clicked
   */
  const downloadQrCode = e => {
    e.currentTarget.href = document.getElementsByTagName('canvas')[0].toDataURL();
  };

  /**
   * Method called on copy to clipboard success
   * Show alert success message
   *
   * @param {string} text Text copied to clipboard
   * @param {*} result Null in case of error
   */
  const copied = (_text, result) => {
    if (result) {
      // If copied with success
      showSuccess('Configuration string copied to clipboard!');
    }
  };

  const renderUi = () => {
    return (
      <>
        <div className="d-flex flex-column config-string-wrapper">
          <p>
            <strong>Configuration String</strong>
          </p>
          <p className="text-center py-4 flex-fill d-flex align-items-center justify-content-center">
            <QRCode size={200} value={configurationString} />
          </p>
          <p>
            <span className="mb-4 text-left">
              {getShortConfigurationString()}
              <CopyToClipboard text={configurationString} onCopy={copied}>
                <i
                  className="fa fa-lg fa-clone pointer ms-1 float-right"
                  title="Copy to clipboard"
                ></i>
              </CopyToClipboard>
            </span>
          </p>
          <p>
            <a
              className="mt-2"
              onClick={e => downloadQrCode(e)}
              download={`${token.name} (${token.symbol}) - ${configurationString}`}
              href="true"
            >
              Download
              <i className="fa fa-download ms-1 float-right" title="Download QRCode"></i>
            </a>
          </p>
        </div>
        <NewHathorAlert ref={alertSuccess} text={successMessage} type="success" />
      </>
    );
  };

  const renderNewUi = () => {
    return (
      <>
        <div className="token-new-config">
          <strong>CONFIGURATION STRING</strong>
          <span className="qr-code">
            <QRCode size={200} value={configurationString} />
          </span>
          <span className="token-code">{getShortConfigurationString()}</span>
          <span className="actions-token-code">
            <button className="actions-token-code-btn">
              <CopyToClipboard text={configurationString} onCopy={copied}>
                <CopyIcon style={{ color: 'white' }} />
              </CopyToClipboard>
            </button>
            <button className="actions-token-code-btn">
              <a
                className="mt-2"
                onClick={e => downloadQrCode(e)}
                download={`${token.name} (${token.symbol}) - ${configurationString}`}
                href="true"
              >
                <DownloadIcon />
              </a>
            </button>
          </span>
          <NewHathorAlert ref={alertSuccess} text={successMessage} type="success" />
        </div>
      </>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default TokenConfig;
