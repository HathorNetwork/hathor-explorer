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
  /**
   * transactions {Array} List of transactions on the list
   * loading {boolean} If is waiting response of data request
   * firstHash {String} First hash of the list, used in pagination
   * lastHash {String} Last hash of the list, used in pagination
   * hasAfter {boolean} If has more elements after the list page
   * hasBefore {boolean} If has more elements before the list page
   * queryParams {Object} Object with URL parameters data
   * numberOfTransactions {Number} Total number of transactions of the list
   */
  state = {
    transactions: [],
    loading: true,
    firstHash: null,
    lastHash: null,
    hasAfter: false,
    hasBefore: false,
    queryParams: null,
    numberOfTransactions: 0,
  }

  componentDidMount() {
    this.setState({ queryParams: this.props.pagination.obtainQueryParams() }, () => {
      if (this.state.queryParams.token !== null) {
        this.getData(this.state.queryParams);
      }
    });

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.address !== prevProps.address) {
      // This case will be handled by the other component, which will add the token in the URL
      // and then call this method again later
      return;
    }

    const queryParams = this.props.pagination.obtainQueryParams();

    // Do we have new URL params?
    if (!isEqual(this.state.queryParams, queryParams)) {
      // Fetch new data, unless query params were cleared and we were already in the most recent page
      if (queryParams.hash || this.state.hasBefore) {
        this.getData(queryParams);
      }

      if (queryParams.token !== this.state.queryParams.token) {
        // User selected a new token, so we must go to the first page (clear queryParams)
        this.props.pagination.clearOptionalQueryParams();
        this.getData(this.props.pagination.obtainQueryParams());
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

  /**
   * Update the list with a new tx arrived in a ws message
   * Checks if the list is on the first page, so it can have a new element
   * Also validates if this tx is compatible with the list
   *
   * @param {Object} tx Data of a newly arrived tx
   */
  updateListWs = (tx) => {
    // We only add new tx/blocks if it's the first page
    if (!this.state.hasBefore) {
      if (this.props.shouldUpdate(tx, true)) {
        let transactions = this.state.transactions;
        let hasAfter = (this.state.hasAfter || (transactions.length === TX_COUNT && !this.state.hasAfter))
        transactions = helpers.updateListWs(transactions, tx, TX_COUNT);

        let firstHash = transactions[0].tx_id;
        let lastHash = transactions[transactions.length-1].tx_id;

        const newNumberOfTransactions = this.state.numberOfTransactions + 1;

        // Finally we update the state again
        this.setState({ transactions, hasAfter, firstHash, lastHash, numberOfTransactions: newNumberOfTransactions });
        if (this.props.addressSummaryRef.current) {
          this.props.addressSummaryRef.current.updateNumberOfTransactions(newNumberOfTransactions);
        }
      }
    }
  }

  /**
   * Update component state when new list data arrives
   *
   * @param {Object} data Response data from the server
   * @param {Object} queryParams URL parameters
   */
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
        this.props.pagination.clearOptionalQueryParams();
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
      numberOfTransactions: data.total,
    });

    if (this.props.addressSummaryRef.current) {
      this.props.addressSummaryRef.current.updateNumberOfTransactions(data.total);
    }
  }

  /**
   * Update transactions data state after requesting data from the server
   *
   * @param {Object} queryParams URL parameters
   */
  getData = (queryParams) => {
    hathorLib.walletApi.getSearchAddress(this.props.address, TX_COUNT, queryParams.hash, queryParams.page, queryParams.token, (response) => {
      if (response.success) {
        this.handleDataFetched(response, queryParams);
      }
    });
  }

  /**
   * We get the final balance for the search address and selected token
   *
   * @param {Object} tx Transaction data
   *
   * @return {Number} Final balance value (can be negative value, in case we spent more than received for the search address)
   */
  calculateAddressBalance = (tx) => {
    const token = this.props.pagination.obtainQueryParams().token;
    let value = 0;

    for (let txin of tx.inputs) {
      if (txin.token === token && txin.decoded.address === this.props.address) {
        if (!hathorLib.wallet.isAuthorityOutput(txin)) {
          value -= txin.value;
        }
      }
    }

    for (let txout of tx.outputs) {
      if (txout.token === token && txout.decoded.address === this.props.address) {
        if (!hathorLib.wallet.isAuthorityOutput(txout)) {
          value += txout.value;
        }
      }
    }

    return value;
  }

  /**
   * Check if the tx has only inputs and outputs that are authorities in the search address
   *
   * @param {Object} tx Transaction data
   *
   * @return {boolean} If the tx has only authority in the search address
   */
  isAllAuthority = (tx) => {
    for (let txin of tx.inputs) {
      if (!hathorLib.wallet.isAuthorityOutput(txin) && txin.decoded.address === this.props.address) {
        return false;
      }
    }

    for (let txout of tx.outputs) {
      if (!hathorLib.wallet.isAuthorityOutput(txout) && txout.decoded.address === this.props.address) {
        return false;
      }
    }

    return true;
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
                <Link className="page-link" to={this.props.pagination.paginationUrl({hash: this.state.firstHash, page: 'previous'})}>Previous</Link>
              </li>
              <li ref="txNext" className={(!this.state.hasAfter || this.state.transactions.length === 0) ? "page-item disabled" : "page-item"}>
                <Link className="page-link" to={this.props.pagination.paginationUrl({hash: this.state.lastHash, page: 'next'})}>Next</Link>
              </li>
            </ul>
          </nav>
        );
      }
    }

    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped address-history" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Type</th>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-none d-lg-table-cell"></th>
                <th className="d-none d-lg-table-cell"></th>
                <th className="d-none d-lg-table-cell">Value</th>
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
        const value = this.calculateAddressBalance(tx);
        let statusElement = '';
        let trClass = '';
        let prettyValue = hathorLib.helpers.prettyValue(value);
        if (value > 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = <span>Token creation <i className={`fa ml-3 fa-long-arrow-down`}></i></span>;
          } else {
            statusElement = <span>Received <i className={`fa ml-3 fa-long-arrow-down`}></i></span>;
          }
          trClass = 'output-tr';
        } else if (value < 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = <span>Token deposit <i className={`fa ml-3 fa-long-arrow-up`}></i></span>
          } else {
            statusElement = <span>Sent <i className={`fa ml-3 fa-long-arrow-up`}></i></span>
          }
          trClass = 'input-tr';
        } else {
          if (this.isAllAuthority(tx)) {
            statusElement = <span>Authority</span>;
            prettyValue = '--';
          }
        }
        return (
          <tr key={tx.tx_id} className={trClass} onClick={(e) => this.props.onRowClicked(tx.tx_id)}>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getTxType(tx)}</td>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(tx.tx_id)}</td>
            <td className="d-none d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td className={tx.is_voided ? 'voided state' : 'state'}>{statusElement}</td>
            <td>{tx.is_voided && <span className="voided-element">Voided</span>}</td>
            <td className='value'><span className={tx.is_voided ? 'voided' : ''}>{prettyValue}</span></td>
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
 * pagination: Instance of pagination class that handles the URL parameters
 * updateNumberOfTransactions: Function executed when the total number of transactions on the list changes
 */
AddressHistory.propTypes = {
  address: PropTypes.string.isRequired,
  shouldUpdate: PropTypes.func.isRequired,
  onRowClicked: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
  updateNumberOfTransactions: PropTypes.func.isRequired,
};


export default AddressHistory;
