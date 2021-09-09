/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TxRow from '../components/tx/TxRow';
import hathorLib from '@hathor/wallet-lib';
import { DASHBOARD_TX_COUNT, DASHBOARD_BLOCKS_COUNT } from '../constants';


/**
 * Dashboard screen that show some blocks and some transactions
 *
 * @memberof Screens
 */
class DashboardTx extends React.Component {
  /**
   * transactions {Array} Array of transactions to show in the dashboard
   * blocks {Array} Array of blocks to show in the dashboard
   */
  state = { transactions: [], blocks: [] };

  componentDidMount = () => {
    this.getInitialData();
    hathorLib.WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentWillUnmount = () => {
    hathorLib.WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  /**
   * Get initial data to fill the screen and update the state with this data
   */
  getInitialData = () => {
    hathorLib.txApi.getDashboardTx(DASHBOARD_BLOCKS_COUNT, DASHBOARD_TX_COUNT, (data) => {
      this.updateData(data.transactions, data.blocks);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  /**
   * Handle websocket message to see if should update the list
   */
  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      this.updateListWs(wsData);
    }
  }

  /**
   * Update list because a new element arrived
   */
  updateListWs = (tx) => {
    if (tx.is_block) {
      let blocks = this.state.blocks;

      blocks = hathorLib.helpers.updateListWs(blocks, tx, DASHBOARD_BLOCKS_COUNT);

      // Finally we update the state again
      this.setState({ blocks });
    } else {
      let transactions = this.state.transactions;

      transactions = hathorLib.helpers.updateListWs(transactions, tx, DASHBOARD_TX_COUNT);

      // Finally we update the state again
      this.setState({ transactions });
    }
  }

  /**
   * Update state data for transactions and blocks
   */
  updateData = (transactions, blocks) => {
    this.setState({ transactions, blocks });
  }

  /**
   * Go to specific transaction or block page after clicking on the link
   */
  goToList = (e, to) => {
    e.preventDefault();
    this.props.history.push(to);
  }

  render() {
    const renderTableBody = () => {
      return (
        <tbody>
          {this.state.blocks.length ?
              <tr className="tr-title"><td colSpan="2">Blocks <a href="/blocks/">(See all blocks)</a></td></tr>
          : null}
          {renderRows(this.state.blocks)}
          {this.state.transactions.length ?
              <tr className="tr-title"><td colSpan="2">Transactions <a href="/transactions/">(See all transactions)</a></td></tr>
          : null}
          {renderRows(this.state.transactions)}
        </tbody>
      );
    }

    const renderRows = (elements) => {
      return elements.map((tx, idx) => {
        return (
          <TxRow key={tx.tx_id} tx={tx} />
        );
      });
    }

    return (
      <div className="content-wrapper">
        <div className="table-responsive">
          <table className="table" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-table-cell d-lg-none" colSpan="2">Hash<br/>Timestamp</th>
              </tr>
            </thead>
            {renderTableBody()}
          </table>
        </div>
      </div>
    );
  }
}

export default DashboardTx;
