/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import HathorAlert from '../components/HathorAlert';
import Transactions from '../components/Transactions';
import hathorLib from '@hathor/wallet-lib';
import { TX_COUNT } from '../constants';

/**
 * Screen to manage a token. See total amount, if can mint/melt and the history of transaction
 *
 * @memberof Screens
 */
class TokenDetail extends React.Component {
  /**
   * token {Object} selected token data
   * successMessage {string} success message to show
   * errorMessage {string} error message to show
   * totalSupply {number} Token total supply
   * canMint {boolean} If this token can still be minted
   * canMelt {boolean} If this token can still be melted
   * paramUID {string} UID of token in the URL
   * transactions {Array} Array of transactions for the token
   */
  state = {
    token: null,
    successMessage: '',
    errorMessage: '',
    totalSupply: 0,
    canMint: null,
    canMelt: null,
    paramUID: '',
    transactions: [],
  };

  componentDidMount() {
    const { match: { params } } = this.props;

    this.setState({ paramUID: params.tokenUID }, () => {
      this.updateTokenInfo();
    });
  }

  /**
   * Upadte token info getting data from the full node (can mint, can melt, total supply)
   */
  updateTokenInfo = () => {
    hathorLib.walletApi.getTokenInfo(this.state.paramUID, (response) => {
      if (response.success) {
        this.setState({
          token: {uid: this.state.paramUID, name: response.name, symbol: response.symbol },
          totalSupply: response.total,
          canMint: response.mint.length > 0,
          canMelt: response.melt.length > 0,
        });
      } else {
        this.setState({ errorMessage: response.message });
      }
    });
  }

  /**
   * Called when user clicks to download the qrcode
   * Add the href from the qrcode canvas
   *
   * @param {Object} e Event emitted by the link clicked
   */
  downloadQrCode = (e) => {
    e.currentTarget.href = document.getElementsByTagName('canvas')[0].toDataURL();
  }

  /**
   * Show alert success message
   *
   * @param {string} message Success message
   */
  showSuccess = (message) => {
    this.setState({ successMessage: message }, () => {
      this.refs.alertSuccess.show(3000);
    })
  }

  /**
   * Method called on copy to clipboard success  
   * Show alert success message
   *
   * @param {string} text Text copied to clipboard
   * @param {*} result Null in case of error
   */
  copied = (text, result) => {
    if (result) {
      // If copied with success
      this.showSuccess('Configuration string copied to clipboard!');
    }
  }

  /**
   * Checks if the recently arrived transaction should trigger an update on the list
   * It returns true if the transaction there is an input or output of the token
   *
   * @param {Object} tx Transaction data received in the websocket
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  shouldUpdateList = (tx) => {
    for (const input of tx.inputs) {
      if (input.token === this.state.paramUID) {
        return true;
      }
    }

    for (const output of tx.outputs) {
      if (output.token === this.state.paramUID) {
        return true;
      }
    }

    return false;
  }

  /*
   * Method called when updating the list with new data
   * Call the API of token history
   *
   * @param {number} timestamp Timestamp reference of the pagination
   * @param {string} hash Hash reference of the pagination
   * @param {string} page Button clicked in the pagination ('previous' or 'next')
   *
   * @return {Promise} Promise to be resolved when new data arrives
   */
  updateListData = (timestamp, hash, page) => {
    const promise = new Promise((resolve, reject) => {
      hathorLib.walletApi.getTokenHistory(this.state.paramUID, TX_COUNT, hash, timestamp, page, (response) => {
        resolve(response);
      });
    });
    return promise;
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="content-wrapper flex align-items-start">
          <p className="text-danger">{this.state.errorMessage}</p>
        </div>
      )
    }

    if (!this.state.token) return null;

    const configurationString = hathorLib.tokens.getConfigurationString(this.state.token.uid, this.state.token.name, this.state.token.symbol);

    const getShortConfigurationString = () => {
      const configArr = configurationString.split(':');
      return `${configArr[0]}:${configArr[1]}...${configArr[3]}`;
    }

    const renderTokenInfo = () => {
      return (
        <div>
          <p className="mt-3 mb-2"><strong>Total supply: </strong>{hathorLib.helpers.prettyValue(this.state.totalSupply)}</p>
          <p className="mt-2 mb-2"><strong>Can mint: </strong>{this.state.canMint ? <i className="fa fa-check ml-1" title="Can mint"></i> : <i className="fa fa-close ml-1" title="Can't mint"></i>}</p>
          <p className="mt-2 mb-4"><strong>Can melt: </strong>{this.state.canMelt ? <i className="fa fa-check ml-1" title="Can melt"></i> : <i className="fa fa-close ml-1" title="Can't melt"></i>}</p>
        </div>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        <div className='d-flex flex-row align-items-start justify-content-between token-detail-top'>
          <div className='d-flex flex-column justify-content-between mt-4'>
            <div className='token-wrapper d-flex flex-row align-items-center mb-3'>
              <p className='token-name mb-0'>
                <strong>{this.state.token.name} ({this.state.token.symbol})</strong>
              </p>
            </div>
            {renderTokenInfo()}
          </div>
          <div className='d-flex flex-column align-items-center config-string-wrapper mt-4'>
            <p><strong>Configuration String</strong></p>
            <span ref="configurationString" className="mb-2">
              {getShortConfigurationString()}
              <CopyToClipboard text={configurationString} onCopy={this.copied}>
                <i className="fa fa-clone pointer ml-1" title="Copy to clipboard"></i>
              </CopyToClipboard>
            </span> 
            <QRCode size={200} value={configurationString} />
            <a className="mt-2" onClick={(e) => this.downloadQrCode(e)} download={`${this.state.token.name} (${this.state.token.symbol}) - ${configurationString}`} href="true" ref="downloadLink">Download <i className="fa fa-download ml-1" title="Download QRCode"></i></a>
          </div>
        </div>
        <div className='d-flex flex-column align-items-start justify-content-center mt-5'>
          <Transactions title={<h2>Transaction History</h2>} shouldUpdateList={this.shouldUpdateList} updateData={this.updateListData} />
        </div>
        <HathorAlert ref="alertSuccess" text={this.state.successMessage} type="success" />
      </div>
    )
  }
}

export default TokenDetail;