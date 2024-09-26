/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Transactions from '../components/tx/Transactions';
import metadataApi from '../api/metadataApi';
import tokenApi from '../api/tokenApi';
import TokenDetailsTop from '../components/token/TokenDetailsTop';
import TokenAlerts from '../components/token/TokenAlerts';

/**
 * Screen to manage a token. See total amount, if can mint/melt and the history of transaction
 *
 * @memberof Screens
 */
function TokenDetail() {
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
   * metadataLoaded {boolean} If token metadata was loaded
   */
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  const { tokenUID } = useParams();

  useEffect(() => {
    updateTokenInfo(tokenUID).catch(e => console.error(e));
    updateTokenMetadata(tokenUID).catch(e => console.error(e));
  }, [tokenUID]);

  /**
   * Upadte token info getting data from the full node (can mint, can melt, total supply)
   */
  const updateTokenInfo = async id => {
    const response = await tokenApi.get(id);
    if (!response.success) {
      setErrorMessage(response.message);
      return;
    }

    setToken(oldToken => ({
      ...oldToken,
      uid: id,
      name: response.name,
      symbol: response.symbol,
      totalSupply: response.total,
      canMint: response.mint.length > 0,
      canMelt: response.melt.length > 0,
      transactionsCount: response.transactions_count,
    }));
  };

  const updateTokenMetadata = async id => {
    const data = await metadataApi.getDagMetadata(id);
    setMetadataLoaded(true);
    if (!data) {
      return;
    }
    setToken(oldToken => {
      return {
        ...oldToken,
        uid: id,
        meta: data,
      };
    });
  };

  /**
   * Checks if the recently arrived transaction should trigger an update on the list
   * It returns true if, in the transaction, there is an input or output of the token
   *
   * @param {Object} tx Transaction data received in the websocket
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  const shouldUpdateList = tx => {
    for (const input of tx.inputs) {
      if (input.token === token.uid) {
        return true;
      }
    }

    for (const output of tx.outputs) {
      if (output.token === token.uid) {
        return true;
      }
    }

    return false;
  };

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
  const updateListData = (timestamp, hash, page) => {
    return tokenApi.getHistory(token.uid, timestamp, hash, page);
  };

  if (errorMessage) {
    return (
      <div className="content-wrapper flex align-items-start">
        <p className="text-danger">{errorMessage}</p>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="content-wrapper flex align-items-center">
      <TokenAlerts token={token} />
      <TokenDetailsTop token={token} metadataLoaded={metadataLoaded} />
      <div className="d-flex flex-column align-items-start justify-content-center mt-5">
        <Transactions
          title={<h2>Transaction History</h2>}
          shouldUpdateList={shouldUpdateList}
          updateData={updateListData}
        />
      </div>
    </div>
  );
}

export default TokenDetail;
