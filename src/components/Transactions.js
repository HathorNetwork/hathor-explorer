/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import {TX_COUNT} from '../constants';
import TxRow from './TxRow';
import helpers from '../utils/helpers';
import WebSocketHandler from '../WebSocketHandler';


class Transactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transactions: [],
      firstHash: null,
      firstTimestamp: null,
      lastHash: null,
      lastTimestamp: null,
      loaded: false,
      hasAfter: false,
      hasBefore: false,
    }
  }

  componentDidMount() {
    this.getData(true, null, null, '');

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      this.updateListWs(wsData);
    }
  }

  updateListWs = (tx) => {
    // We only add new tx/blocks if it's the first page
    if (!this.state.hasBefore) {
      if (this.props.shouldUpdateList(tx)) {
        let transactions = this.state.transactions;
        let hasAfter = (this.state.hasAfter || (transactions.length === TX_COUNT && !this.state.hasAfter))
        transactions = helpers.updateListWs(transactions, tx, TX_COUNT);

        let firstHash = transactions[0].tx_id;
        let firstTimestamp = transactions[0].timestamp;
        let lastHash = transactions[transactions.length-1].tx_id;
        let lastTimestamp = transactions[transactions.length-1].timestamp;

        // Finally we update the state again
        this.setState({ transactions, hasAfter, firstHash, lastHash, firstTimestamp, lastTimestamp });
      }
    }
  }

  handleDataFetched = (data, first, page) => {
    // Handle differently if is the first GET response we receive
    // page indicates if was clicked 'previous' or 'next'
    // Set first and last hash of the transactions
    let firstHash = null;
    let lastHash = null;
    let firstTimestamp = null;
    let lastTimestamp = null;
    if (data.transactions.length) {
      firstHash = data.transactions[0].tx_id;
      lastHash = data.transactions[data.transactions.length-1].tx_id;
      firstTimestamp = data.transactions[0].timestamp;
      lastTimestamp = data.transactions[data.transactions.length-1].timestamp;
    }

    let hasAfter = false;
    let hasBefore = false;
    if (first) {
      // Before is always false, so we check after
      hasAfter = data.has_more;
    } else {
      if (page === 'previous') {
        hasAfter = true;
        hasBefore = data.has_more;
      } else {
        hasBefore = true;
        hasAfter = data.has_more;
      }
    }

    this.setState({ transactions: data.transactions, loaded: true, firstHash, lastHash, firstTimestamp, lastTimestamp, hasAfter, hasBefore });
  }

  getData = (first, timestamp, hash, page) => {
    this.props.updateData(timestamp, hash, page).then((data) => {
      this.handleDataFetched(data, first, page);
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  previousClicked = (e) => {
    e.preventDefault();
    this.getData(false, this.state.firstTimestamp, this.state.firstHash, 'previous');
  }

  nextClicked = (e) => {
    e.preventDefault();
    this.getData(false, this.state.lastTimestamp, this.state.lastHash, 'next');
  }

  render() {
    const loadPagination = () => {
      if (this.state.transactions.length === 0) {
        return null;
      } else {
        return (
          <nav aria-label="Tx pagination" className="d-flex justify-content-center">
            <ul className="pagination">
              <li ref="txPrevious" className={(!this.state.hasBefore || this.state.transactions.length === 0) ? "page-item mr-3 disabled" : "page-item mr-3"}><a className="page-link" onClick={(e) => this.previousClicked(e)} href="">Previous</a></li>
              <li ref="txNext" className={(!this.state.hasAfter || this.state.transactions.length === 0) ? "page-item disabled" : "page-item"}><a className="page-link" href="" onClick={(e) => this.nextClicked(e)}>Next</a></li>
            </ul>
          </nav>
        );
      }
    }

    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-table-cell d-lg-none" colSpan="2">Hash<br/>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loadTableBody()}
            </tbody>
          </table>
        </div>
      );
    }

    const loadTableBody = () => {
      return this.state.transactions.map((tx, idx) => {
        return (
          <TxRow key={tx.tx_id} tx={tx} />
        );
      });
    }

    return (
      <div className="w-100">
        {this.props.title}
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : loadTable()}
        {loadPagination()}
      </div>
    );
  }
}

export default Transactions;
