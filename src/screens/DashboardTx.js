/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useState } from 'react';
import TxRow from '../components/tx/TxRow';
import WebSocketHandler from '../WebSocketHandler';
import { DASHBOARD_BLOCKS_COUNT, DASHBOARD_TX_COUNT } from '../constants';
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
   * Handles a websocket message and checks if it should update the list.
   * If so, which list should be updated.
   * @param {unknown} wsData Websocket message object
   */
  const handleWebsocket = useCallback(wsData => {
    // Discard any message that is not of the expected type
    if (wsData.type !== 'network:new_tx_accepted') {
      return;
    }

    if (wsData.is_block) {
      // Updates the Blocks list
      setBlocks(currentBlocks => {
        // Create a new array to be mutated by the helper
        const oldBlocks = [...currentBlocks];

        // Finally we update the state again
        return helpers.updateListWs(oldBlocks, wsData, DASHBOARD_BLOCKS_COUNT);
      });
    } else {
      // Updates the Transactions list
      setTransactions(currentTxs => {
        // Create a new array to be mutated by the helper
        const oldTransactions = [...currentTxs];

        // Finally we update the state again
        return helpers.updateListWs(oldTransactions, wsData, DASHBOARD_TX_COUNT);
      });
    }
  }, []);

  useEffect(() => {
    // Fetches initial data for the screen
    txApi
      .getDashboardTx(DASHBOARD_BLOCKS_COUNT, DASHBOARD_TX_COUNT)
      .then(dashboardData => {
        setTransactions(dashboardData.transactions);
        setBlocks(dashboardData.blocks);
      })
      .catch(e => console.error(e));

    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [handleWebsocket]);

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
