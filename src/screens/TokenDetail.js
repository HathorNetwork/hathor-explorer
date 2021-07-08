/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Transactions from '../components/Transactions';
import hathorLib from '@hathor/wallet-lib';
import tokenApi from '../api/tokenApi';
import { TX_COUNT } from '../constants';
import TokenDetailsTop from '../components/token/TokenDetailsTop';
import TokenDetailsTopNFT from '../components/token/TokenDetailsTopNFT';
import TokenAlerts from '../components/token/TokenAlerts';


/**
 * Screen to manage a token. See total amount, if can mint/melt and the history of transaction
 *
 * @memberof Screens
 */
class TokenDetail extends React.Component {
  /**
   * token {Object} selected token data
   *    - uid {string} UID of token
   *    - name {string} Token Name
   *    - symbol {string} Token symbol
   *    - totalSupply {number} Token total supply
   *    - canMint {boolean} If this token can still be minted
   *    - canMelt {boolean} If this token can still be melted
   *    - transactionsCount {number} Number of transactions made with this token
   *    - meta {Object} Token metadata
   *        - banned {boolean} If this token is banned
   *        - verified {boolean} If this token is verified
   *        - nft {Object} Token nft data
   *            - type {string} type of file
   *            - file {string} url of file
   * errorMessage {string} error message to show
   * transactions {Array} Array of transactions for the token
   */
  state = {
    token: null,
    errorMessage: '',
    transactions: [],
  };

  componentDidMount() {
    const { match: { params } } = this.props;

    this.setTokenId(params.tokenUID);
  }

  setTokenId(id) {
    this.updateTokenInfo(id);
    this.updateTokenMetadata(id);
  }

  /**
   * Upadte token info getting data from the full node (can mint, can melt, total supply)
   */
  updateTokenInfo = (id) => {
    hathorLib.walletApi.getGeneralTokenInfo(id, (response) => {
      if (response.success) {
        this.setState((oldState) => {
          return {
            token: {
              ...oldState.token,
              uid: id,
              name: response.name,
              symbol: response.symbol,
              totalSupply: response.total,
              canMint: response.mint.length > 0,
              canMelt: response.melt.length > 0,
              transactionsCount: response.transactions_count,
            },
          }
        });
      } else {
        this.setState({ errorMessage: response.message });
      }
    });
  }

  updateTokenMetadata = (id) => {
    tokenApi.getMetadata(id).then((data) => {
      if (data) {
        this.setState((oldState) => {
          return {
            token: {
              ...oldState.token,
              uid: id,
              meta: data
            }
          }
        });
      }
    });
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
      if (input.token === this.state.token.uid) {
        return true;
      }
    }

    for (const output of tx.outputs) {
      if (output.token === this.state.token.uid) {
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
      hathorLib.walletApi.getTokenHistory(this.state.token.uid, TX_COUNT, hash, timestamp, page, (response) => {
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

    const isNFT = () => {
      return this.state.token.meta && this.state.token.meta.nft;
    }

    return (
      <div className="content-wrapper flex align-items-center">
        <TokenAlerts token={this.state.token} />
        { isNFT() ? 
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
