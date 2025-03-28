/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Transactions from '../components/tx/Transactions';
import txApi from '../api/txApi';
import { TX_COUNT } from '../constants';

function TransactionList() {
  /**
   * Checks if the recently arrived transaction should trigger an update on the list
   * It returns true if it's a transaction (not a block)
   *
   * @param {Object} tx Transaction data received in the websocket
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  const shouldUpdateList = tx => {
    return !tx.is_block;
  };

  /*
   * Method called when updating the list with new data
   * Call the API of transactions list
   *
   * @param {number} timestamp Timestamp reference of the pagination
   * @param {string} hash Hash reference of the pagination
   * @param {string} page Button clicked in the pagination ('previous' or 'next')
   *
   * @return {Promise} Promise to be resolved when new data arrives
   */
  const updateData = (timestamp, hash, page) => {
    return txApi.getTransactions('tx', TX_COUNT, timestamp, hash, page);
  };

  const renderNewUi = () => {
    return (
      <div className="tx-container">
        <Transactions
          title={<h1 className="title-tx-page">Transactions</h1>}
          shouldUpdateList={shouldUpdateList}
          updateData={updateData}
        />
      </div>
    );
  };

  return renderNewUi();
}

export default TransactionList;
