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
import helpers from '../utils/helpers';
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
    nft: null
  };

  componentDidMount() {
    const { match: { params } } = this.props;

    this.setState({ paramUID: params.tokenUID }, () => {
      this.updateTokenInfo();
      this.fetchNftList();
    });
  }

  /**
   * Upadte token info getting data from the full node (can mint, can melt, total supply)
   */
  updateTokenInfo = () => {
    hathorLib.walletApi.getGeneralTokenInfo(this.state.paramUID, (response) => {
      if (response.success) {
        this.setState({
          token: {uid: this.state.paramUID, name: response.name, symbol: response.symbol },
          totalSupply: response.total,
          canMint: response.mint.length > 0,
          canMelt: response.melt.length > 0,
          transactionsCount: response.transactions_count,
        });
      } else {
        this.setState({ errorMessage: response.message });
      }
    });
  }

  /**
   * Fetch NFT info for custom NFT Tokens
   */
  fetchNftList() {
    fetch(helpers.nftTokenListUrl()).then((response) => {
      response.json().then((data) => {
        this.setState({
          nft: data.find(obj => obj.id === this.state.paramUID)
        });
      });
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
   * It returns true if, in the transaction, there is an input or output of the token
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
        <div className="token-general-info">
          <p className="token-general-info__uid"><strong>UID: </strong><br/>{this.state.token.uid}</p>
          <p><strong>Name: </strong>{this.state.token.name}</p>
          <p><strong>Symbol: </strong>{this.state.token.symbol}</p>
          <p><strong>Total supply: </strong>{hathorLib.helpers.prettyValue(this.state.totalSupply)} {this.state.token.symbol}</p>
          <p>
            <strong>Can mint new tokens: </strong>
            {this.state.canMint ? 'Yes' : 'No'}
            <a href="javascript:;" className="info-hover-wrapper float-right">
              <i className="fa fa-info-circle" title="Mint info"></i>
              <span className="subtitle subtitle info-hover-popover">Indicates whether the token owner can create new tokens, increasing the total supply</span>
            </a>
          </p>
          <p>
            <strong>Can melt tokens: </strong>
            {this.state.canMelt ? 'Yes' : 'No'}
            <a href="javascript:;" className="info-hover-wrapper float-right">
              <i className="fa fa-info-circle" title="Melt info"></i>
              <span className="subtitle info-hover-popover">Indicates whether the token owner can destroy tokens, decreasing the total supply</span>
            </a>
          </p>
          <p><strong>Total number of transactions: </strong>{this.state.transactionsCount}</p>
        </div>
      );
    }

    const renderTokenAlert = () => {
      return (
        <div className="alert alert-warning backup-alert" role="alert">
          Only the UID is unique, there might be more than one token with the same name and symbol.
        </div>
      )
    }

    const renderNftPreview = () => {
      if (this.state.nft) {

        let media;

        if (this.state.nft.type === 'image') {
          media = <img src={this.state.nft.file} width="100%" height="100%" />;
        } else {
          media = (
            <video controls>
              <source src={this.state.nft.file} type="video/mp4" />
              Your browser does not support html video tag.
            </video>
          )
        }
        return (
          <div className='d-flex flex-column token-nft-preview'>
            <p><strong>NFT preview</strong></p>
            <figure class="figure flex-fill p-4 d-flex align-items-center justify-content-center">
              { media }
            </figure>
          </div>
        )
      }
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {renderTokenAlert()}
        <div className='d-flex flex-column flex-lg-row align-items-lg-stretch align-items-center justify-content-between token-detail-top'>
          <div className='d-flex flex-column justify-content-between mt-4'>
            <div className='token-wrapper d-flex flex-row align-items-center mb-3'>
              <p className='token-name mb-0'>
                <strong>{this.state.token.name} ({this.state.token.symbol})</strong>
              </p>
            </div>
            {renderTokenInfo()}
          </div>
          <div className='d-flex flex-column align-items-left config-string-wrapper'>
            <p><strong>Configuration String</strong></p>
            <p className="text-center py-4 flex-fill d-flex align-items-center justify-content-center">
              <QRCode size={200} value={configurationString} />
            </p>
            <p>
              <span ref="configurationString" className="mb-4 text-left">
                {getShortConfigurationString()}
                <CopyToClipboard text={configurationString} onCopy={this.copied}>
                  <i className="fa fa-lg fa-clone pointer ml-1 float-right" title="Copy to clipboard"></i>
                </CopyToClipboard>
              </span> 
            </p>
            <p>
              <a className="mt-2" onClick={(e) => this.downloadQrCode(e)} download={`${this.state.token.name} (${this.state.token.symbol}) - ${configurationString}`} href="true" ref="downloadLink">
                Download
                <i className="fa fa-download ml-1 float-right" title="Download QRCode"></i>
              </a>
            </p>
          </div>
          {renderNftPreview()}
        </div>
        <hr />
        <div className='d-flex flex-column align-items-start justify-content-center mt-5'>
          <Transactions title={<h2>Transaction History</h2>} shouldUpdateList={this.shouldUpdateList} updateData={this.updateListData} />
        </div>
        <HathorAlert ref="alertSuccess" text={this.state.successMessage} type="success" />
      </div>
    )
  }
}

export default TokenDetail;