/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import WebSocketHandler from '../WebSocketHandler';
import { DASHBOARD_BLOCKS_COUNT, DASHBOARD_TX_COUNT } from '../constants';
import txApi from '../api/txApi';
import helpers from '../utils/helpers';
import TxRow from '../components/tx/TxRow';
import { useIsMobile, useNewUiEnabled } from '../hooks';

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
  const newUiEnabled = useNewUiEnabled();

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

  const [tableVisible, setTableVisible] = useState('transactions');

  const transactionButtonRef = useRef(null);

  const isMobile = useIsMobile();

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
    return elements.map(tx => <TxRow key={tx.tx_id} tx={tx} ellipsis />);
  };

  const renderUi = () => {
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
  };

  const renderNewTables = (content, text, path) => {
    return (
      <div style={{ textAlign: 'center' }}>
        <div>
          <table className="table-stylized" style={{ tableLayout: 'inherit' }}>
            <thead>
              <tr>
                <th>HASH</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>{renderRows(content)}</tbody>
          </table>
        </div>
        <button
          onClick={() => {
            window.location.href = `${path}`;
          }}
          className="table-home-button"
        >
          {text}
        </button>
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <br />
        <div className="container-title-page">
          <p className="title-page data-title">Live Data</p>
          <div className="buttons-mobile-container">
            <button
              ref={transactionButtonRef}
              className={`button-home-tables ${tableVisible === 'transactions' ? 'active' : ''}`}
              onClick={() => setTableVisible('transactions')}
            >
              <span>Transaction</span>
            </button>
            <button
              className={`button-home-tables ${tableVisible === 'blocks' ? 'active' : ''}`}
              onClick={() => setTableVisible('blocks')}
            >
              <span>Blocks</span>
            </button>
          </div>
        </div>
        <div className="tables-container">
          {isMobile ? (
            <>
              {tableVisible === 'transactions' && (
                <div className="table-container">
                  {renderNewTables(transactions, 'See all transactions', '/transactions/')}
                </div>
              )}
              {tableVisible === 'blocks' && (
                <div className="table-container">
                  {renderNewTables(blocks, 'See all blocks', '/blocks/')}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="table-container">
                <p>Latest Transactions</p>
                {renderNewTables(transactions, 'See all transactions', '/transactions/')}
              </div>
              <div className="table-container">
                <p>Latest Blocks</p>

                {renderNewTables(blocks, 'See all blocks', '/blocks/')}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default DashboardTx;
