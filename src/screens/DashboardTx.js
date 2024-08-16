/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useState } from 'react';
import TxRow from '../components/tx/TxRow';
import WebSocketHandler from '../WebSocketHandler';
import { DASHBOARD_TX_COUNT, DASHBOARD_BLOCKS_COUNT } from '../constants';
import txApi from '../api/txApi';
import helpers from '../utils/helpers';

/**
 * Dashboard screen that show some blocks and some transactions
 *
 * @memberof Screens
 */
function DashboardTx() {
  // transactions {Array} Array of transactions to show in the dashboard
  const [transactions, setTransactions] = useState([]);
  // blocks {Array} Array of blocks to show in the dashboard
  const [blocks, setBlocks] = useState([]);

  /**
   * Get initial data to fill the screen and update the state with this data
   */
  const getInitialData = useCallback(() => {
    txApi
      .getDashboardTx(DASHBOARD_BLOCKS_COUNT, DASHBOARD_TX_COUNT)
      .then(res => {
        updateData(res.transactions, res.blocks);
      })
      .catch(e => {
        // Error in request
        console.log(e);
      });
  }, []);

  /**
   * Update list because a new element arrived
   */
  const updateListWs = useCallback(tx => {
    if (tx.is_block) {
      setBlocks(currentBlocks => {
        // Create a new array to be mutated by the helper
        const oldBlocks = [...currentBlocks];
        const newBlocks = helpers.updateListWs(oldBlocks, tx, DASHBOARD_BLOCKS_COUNT);

        // Finally we update the state again
        return newBlocks;
      });
    } else {
      setTransactions(currentTxs => {
        // Create a new array to be mutated by the helper
        const oldTransactions = [...currentTxs];
        const newTransactions = helpers.updateListWs(oldTransactions, tx, DASHBOARD_TX_COUNT);

        // Finally we update the state again
        return newTransactions;
      });
    }
  }, []);

  /**
   * Handle websocket message to see if should update the list
   */
  const handleWebsocket = useCallback(
    wsData => {
      if (wsData.type === 'network:new_tx_accepted') {
        updateListWs(wsData);
      }
    },
    [updateListWs]
  );

  useEffect(() => {
    getInitialData();
    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [getInitialData, handleWebsocket]);

  /**
   * Update state data for transactions and blocks
   */
  const updateData = (transactionsData, blocksData) => {
    setTransactions(transactionsData);
    setBlocks(blocksData);
  };

  const renderTableBody = () => {
    return (
      <tbody>
        {blocks.length ? (
          <tr className="tr-title">
            <td colSpan="2">
              Blocks <a href="/blocks/">(See all blocks)</a>
            </td>
          </tr>
        ) : null}
        {renderRows(blocks)}
        {transactions.length ? (
          <tr className="tr-title">
            <td colSpan="2">
              Transactions <a href="/transactions/">(See all transactions)</a>
            </td>
          </tr>
        ) : null}
        {renderRows(transactions)}
      </tbody>
    );
  };

  const renderRows = elements => {
    return elements.map(tx => <TxRow key={tx.tx_id} tx={tx} />);
  };

  return (
    <div className="content-wrapper">
      <div className="table-responsive">
        <table className="table" id="tx-table">
          <thead>
            <tr>
              <th className="d-none d-lg-table-cell">Hash</th>
              <th className="d-none d-lg-table-cell">Timestamp</th>
              <th className="d-table-cell d-lg-none" colSpan="2">
                Hash
                <br />
                Timestamp
              </th>
            </tr>
          </thead>
          {renderTableBody()}
        </table>
      </div>
    </div>
  );
}

export default DashboardTx;
