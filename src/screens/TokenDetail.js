/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Transactions from '../components/Transactions';
import hathorLib from '@hathor/wallet-lib';
import helpers from '../utils/helpers';
import { TX_COUNT } from '../constants';
import TokenConfig from '../components/TokenConfig';
import TokenInfo from '../components/TokenInfo';
import TokenNFTPreview from '../components/TokenNFTPreview';
import TokenDetailsTop from '../components/TokenDetailsTop';
import TokenDetailsTopNFT from '../components/TokenDetailsTopNFT';

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
   * paramUID {string} UID of token in the URL
   * transactions {Array} Array of transactions for the token
   */
  state = {
    token: null,
    successMessage: '',
    errorMessage: '',
    paramUID: '',
    transactions: [],
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
        this.setState((oldState) => {
          return {
            token: {
              ...oldState.token,
              uid: this.state.paramUID,
              name: response.name,
              symbol: response.symbol,
              totalSupply: response.total,
              canMint: response.mint.length > 0,
              canMelt: response.melt.length > 0,
              transactionsCount: response.transactions_count,
              nft: oldState.token.nft,
            },
          }
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
    const nftTokenListUrl = helpers.nftTokenListUrl();
    if (nftTokenListUrl) {
      fetch(helpers.nftTokenListUrl()).then((response) => {
        response.json().then((data) => {
          if (Array.isArray(data)) {
            const nft = data.find(obj => obj.id === this.state.paramUID);
            this.setState((oldState) => {
              return {
                token: {
                  ...oldState.token,
                  nft
                }
              }
            });
          }
        });
      });
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

    const renderTokenAlert = () => {
      return (
        <div className="alert alert-warning backup-alert" role="alert">
          Only the UID is unique, there might be more than one token with the same name and symbol.
        </div>
      )
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {renderTokenAlert()}
        { this.state.token.nft ? 
          <TokenDetailsTopNFT token={this.state.token} />
          : <TokenDetailsTop token={this.state.token} />
        }
        <div className='d-flex flex-column align-items-start justify-content-center mt-5'>
          <Transactions title={<h2>Transaction History</h2>} shouldUpdateList={this.shouldUpdateList} updateData={this.updateListData} />
        </div>
      </div>
    )
  }
}

export default TokenDetail;
