/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { TX_COUNT } from '../constants';
import { isEqual } from 'lodash';
import dateFormatter from '../utils/date';
import helpers from '../utils/helpers';
import WebSocketHandler from '../WebSocketHandler';
import colors from '../index.scss';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import PaginationURL from '../utils/pagination';


class AddressHistory extends React.Component {
  pagination = new PaginationURL(['hash', 'page']);

  /**
   * transactions {Array} List of transactions on the list
   * loading {boolean} If is waiting response of data request
   */
  state = {
    transactions: [],
    loading: true,
    firstHash: null,
    lastHash: null,
    hasAfter: false,
    hasBefore: false,
    queryParams: this.pagination.obtainQueryParams(),
  }

  componentDidMount() {
    this.getData(this.state.queryParams);

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.address !== prevProps.address) {
      // Address changed, must update data
      this.pagination.clearQueryParams();
      this.getData(this.pagination.obtainQueryParams());
      return;
    }

    const queryParams = this.pagination.obtainQueryParams();

    // Do we have new URL params?
    if (!isEqual(this.state.queryParams, queryParams)) {
      // Fetch new data, unless query params were cleared and we were already in the most recent page
      if (queryParams.hash || this.state.hasBefore) {
        this.getData(queryParams);
      }
    }
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  /**
   * Called when 'network' ws message arrives
   * If it's a new tx message update data, in case is necessary
   *
   * @param {Object} wsData Data from websocket
   */
  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      this.updateListWs(wsData);
    }
  }

  updateListWs = (tx) => {
    // We only add new tx/blocks if it's the first page
    if (!this.state.hasBefore) {
      if (this.props.shouldUpdate(tx)) {
        let transactions = this.state.transactions;
        let hasAfter = (this.state.hasAfter || (transactions.length === TX_COUNT && !this.state.hasAfter))
        transactions = helpers.updateListWs(transactions, tx, TX_COUNT);

        let firstHash = transactions[0].tx_id;
        let lastHash = transactions[transactions.length-1].tx_id;

        // Finally we update the state again
        this.setState({ transactions, hasAfter, firstHash, lastHash });
      }
    }
  }

  handleDataFetched = (data, queryParams) => {
    // Handle differently if is the first GET response we receive
    // page indicates if was clicked 'previous' or 'next'
    // Set first and last hash of the transactions
    let firstHash = null;
    let lastHash = null;
    if (data.transactions.length) {
      firstHash = data.transactions[0].tx_id;
      lastHash = data.transactions[data.transactions.length-1].tx_id;
    }

    let hasAfter;
    let hasBefore;
    if (queryParams.page === 'previous') {
      hasAfter = true;
      hasBefore = data.has_more;
      if (!hasBefore) {
        // Went back to most recent page: clear URL params
        this.pagination.clearQueryParams();
      }
    } else if (queryParams.page === 'next') {
      hasBefore = true;
      hasAfter = data.has_more;
    } else {
      // First load without parameters
      hasBefore = false;
      hasAfter = data.has_more;
    }

    this.setState({
      transactions: data.transactions,
      loading: false,
      firstHash,
      lastHash,
      hasAfter,
      hasBefore,
      queryParams,
    });
  }

  /**
   * Update transactions data state after requesting data from the server
   */
  getData = (queryParams) => {
    hathorLib.walletApi.getSearchAddress(this.props.address, TX_COUNT, queryParams.hash, queryParams.page, (response) => {
      if (response.success) {
        this.handleDataFetched(response, queryParams);
      }
    });
  }


  render() {
    if (this.state.transactions.length === 0) {
      return <p>This address does not have any transactions yet.</p>
    }

    const loadPagination = () => {
      if (this.state.transactions.length === 0) {
        return null;
      } else {
        return (
          <nav aria-label="Tx pagination" className="d-flex justify-content-center">
            <ul className="pagination">
              <li ref="txPrevious" className={(!this.state.hasBefore || this.state.transactions.length === 0) ? "page-item mr-3 disabled" : "page-item mr-3"}>
                <Link className="page-link" to={this.pagination.paginationUrl({hash: this.state.firstHash, page: 'previous'})}>Previous</Link>
              </li>
              <li ref="txNext" className={(!this.state.hasAfter || this.state.transactions.length === 0) ? "page-item disabled" : "page-item"}>
                <Link className="page-link" to={this.pagination.paginationUrl({hash: this.state.lastHash, page: 'next'})}>Next</Link>
              </li>
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
                <th className="d-none d-lg-table-cell">Type</th>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-table-cell d-lg-none" colSpan="3">Type<br/>Hash<br/>Timestamp</th>
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
          <tr key={tx.tx_id} onClick={(e) => this.props.onRowClicked(tx.tx_id)}>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getTxType(tx)}</td>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(tx.tx_id)}</td>
            <td className="d-none d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td className="d-lg-none d-table-cell pr-3" colSpan="3">{hathorLib.helpers.getTxType(tx)}<br/>{hathorLib.helpers.getShortHash(tx.tx_id)}<br/>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
          </tr>
        );
      });
    }

    return (
      <div className="w-100">
        {this.state.loading ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadTable()}
        {loadPagination()}
      </div>
    );
  }
}

/*
 * address: Address to show summary
 * shouldUpdate: Function that receives a tx data and returns if summary should be updated
 * onRowClicked: Function executed when user clicks on the table row (receives tx_id)
 */
AddressHistory.propTypes = {
  address: PropTypes.string.isRequired,
  shouldUpdate: PropTypes.func.isRequired,
  onRowClicked: PropTypes.func.isRequired,
};


export default AddressHistory;
