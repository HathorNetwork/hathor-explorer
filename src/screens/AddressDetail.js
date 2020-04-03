/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AddressSummary from '../components/AddressSummary';
import AddressHistory from '../components/AddressHistory';
import PaginationURL from '../utils/pagination';
import hathorLib from '@hathor/wallet-lib';
import ReactLoading from 'react-loading';
import colors from '../index.scss';
import WebSocketHandler from '../WebSocketHandler';
import { TX_COUNT } from '../constants';
import { isEqual } from 'lodash';
import helpers from '../utils/helpers';


class AddressDetail extends React.Component {
  pagination = new PaginationURL({
    'hash': {required: false},
    'page': {required: false},
    'token': {required: true}
  });

  addressSummaryRef = React.createRef();

  /*
   * address {String} searched address (from url)
   * balance {Object} Object with balance of each token of this address indexed by tokenUid {uid1: {'name', 'symbol', 'received', 'spent'}}
   * selectedToken {String} UID of the selected token when address has many
   * numberOfTransactions {Number} Total number of transactions of the list
   * transactions {Array} List of transactions history to show
   * hasAfter {boolean} If has more elements after the list page
   * hasBefore {boolean} If has more elements before the list page
   * queryParams {Object} Object with URL parameters data
   * loadingSummary {boolean} If is waiting response of data summary request
   * loadingHistory {boolean} If is waiting response of data history request
   * errorMessage {String} message to be shown in case of an error
   */
  state = {
    address: null,
    balance: {},
    selectedToken: '',
    numberOfTransactions: 0,
    transactions: [],
    hasAfter: false,
    hasBefore: false,
    queryParams: null,
    loadingSummary: true,
    loadingHistory: false,
    errorMessage: '',
  }

  componentDidMount() {
    // Expects address on URL
    this.setState({ queryParams: this.pagination.obtainQueryParams() }, () => {
      this.updateAddress(this.props.match.params.address);
    });

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.address !== this.props.match.params.address) {
      // Address on the URL changed
      this.pagination.clearOptionalQueryParams();
      this.updateAddress(this.props.match.params.address);
      return;
    }

    const queryParams = this.pagination.obtainQueryParams();

    // Do we have new URL params?
    if (!isEqual(this.state.queryParams, queryParams)) {
      if (queryParams.token !== this.state.queryParams.token && queryParams.token !== null) {
        // User selected a new token, so we must go to the first page (clear queryParams)
        this.pagination.clearOptionalQueryParams();
        this.getHistoryData(this.pagination.obtainQueryParams());
        return;
      }

      // Fetch new data, unless query params were cleared and we were already in the most recent page
      if (queryParams.hash || this.state.hasBefore) {
        this.getHistoryData(queryParams);
      }
    }
  }

  /**
   * Called when 'network' ws message arrives
   * If it's a new tx message update data, in case is necessary
   *
   * @param {Object} wsData Data from websocket
   */
  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      if (this.shouldUpdate(wsData, false)) {
        // For summary data we don't check the token
        this.getSummaryData();
      }

      if (this.shouldUpdate(wsData, true)) {
        // For the history list we must check the token
        this.updateListWs(wsData);
      }
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
      if (this.shouldUpdate(tx, true)) {
        let transactions = this.state.transactions;
        let hasAfter = this.state.hasAfter || transactions.length === TX_COUNT;
        transactions = helpers.updateListWs(transactions, tx, TX_COUNT);

        const newNumberOfTransactions = this.state.numberOfTransactions + 1;

        // Finally we update the state again
        this.setState({ transactions, hasAfter, numberOfTransactions: newNumberOfTransactions });
      }
    }
  }

  /**
   * Check if address is valid and then update the state and get data from full node
   * If not valid show error message
   *
   * @param {Object} address New searched address to update state
   */
  updateAddress = (address) => {
    if (hathorLib.transaction.isAddressValid(address)) {
      this.setState({ address, errorMessage: '' }, () => {
        const queryParams = this.pagination.obtainQueryParams();
        if (queryParams.token !== null) {
          // User already have a token selected on the URL
          this.setState({ selectedToken: queryParams.token }, () => {
            this.getSummaryData();
            this.getHistoryData(this.state.queryParams);
          });
        } else {
          // Will get data and select the default token
          // In this case I don't get history data because I still don't know the token
          // When the token changes, I will fetch the history data
          this.getSummaryData();
        }
      });
    } else {
      this.setState({ errorMessage: 'Invalid address.' });
    }
  }

  /**
   * Update transactions data state after requesting data from the server
   *
   * @param {Object} queryParams URL parameters
   */
  getHistoryData = (queryParams) => {
    hathorLib.walletApi.getSearchAddress(this.state.address, TX_COUNT, queryParams.hash, queryParams.page, queryParams.token, (response) => {
      if (response.success) {
        this.handleFetchedData(response, queryParams);
      }
    });
  }


  /**
   * Update component state when new list data arrives
   *
   * @param {Object} data Response data from the server
   * @param {Object} queryParams URL parameters
   */
  handleFetchedData = (data, queryParams) => {
    // Handle differently if is the first GET response we receive
    // page indicates if was clicked 'previous' or 'next'
    // Set first and last hash of the transactions
    let hasAfter;
    let hasBefore;
    if (queryParams.page === 'previous') {
      hasAfter = true;
      hasBefore = data.has_more;
      if (!hasBefore) {
        // Went back to most recent page: clear URL params
        this.pagination.clearOptionalQueryParams();
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
      loadingHistory: false,
      hasAfter,
      hasBefore,
      queryParams,
      numberOfTransactions: data.total,
    });
  }

  /**
   * Request data from server and update state balance
   */
  getSummaryData = () => {
    hathorLib.walletApi.getAddressBalance(this.state.address, (response) => {
      if (response.success) {
        let selectedToken = '';
        if (this.state.selectedToken && this.state.selectedToken in response.tokens_data) {
          // If user had selected a token already, should continue the same
          selectedToken = this.state.selectedToken;
        } else {
          const hathorUID = hathorLib.constants.HATHOR_TOKEN_CONFIG.uid
          if (hathorUID in response.tokens_data) {
            // If HTR is in the token list of this address, it's the default selection
            selectedToken = hathorUID;
          } else {
            // Otherwise we get the first element
            const keys = Object.keys(response.tokens_data);
            selectedToken = keys[0];
          }
        }

        // Update token in the URL
        this.updateTokenURL(selectedToken);

        this.setState({
          balance: response.tokens_data,
          loadingSummary: false,
          selectedToken,
        });
      } else {
        this.setState({
          loadingSummary: false,
          errorMessage: response.message,
        });
      }
    });
  }

  /**
   * Callback to be executed when user changes token on select input
   *
   * @param {String} Value of the selected item
   */
  onTokenSelectChanged = (value) => {
    this.setState({ selectedToken: value });
    this.updateTokenURL(value);
  }

  /**
   * Update URL with new selected token and trigger didUpdate
   *
   * @param {String} New token selected
   */
  updateTokenURL = (token) => {
    const queryParams = this.pagination.obtainQueryParams();
    queryParams.token = token;
    const newURL = this.pagination.setURLParameters(queryParams);
    this.props.history.push(newURL);
  }

  /**
   * Check if the searched address is on the inputs or outputs of the new tx
   *
   * @param {Object} tx Transaction data received in the websocket
   * @param {boolean} checkToken If should also check if token is the same, or just address
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  shouldUpdate = (tx, checkToken) => {
    const arr = [...tx.outputs, ...tx.inputs];
    const token = this.pagination.obtainQueryParams().token;

    for (const element of arr) {
      if (element.decoded.address === this.state.address) {
        // Address is the same
        if ((checkToken && element.token === token) || !checkToken) {
          // Need to check token and token is the same, or no need to check token
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Redirects to transaction detail screen after clicking on a table row
   *
   * @param {String} hash Hash of tx clicked
   */
  onRowClicked = (hash) => {
    this.props.history.push(`/transaction/${hash}`);
  }

  render() {
    const renderData = () => {
      if (this.state.errorMessage) {
        return (
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
        );
      } else if (this.state.address === null) {
        return null;
      } else {
        if (this.state.loadingSummary || this.state.loadingHistory) {
          return <ReactLoading type='spin' color={colors.purpleHathor} delay={500} />
        } else {
          return (
            <div>
              <AddressSummary
                address={this.state.address}
                balance={this.state.balance}
                selectedToken={this.state.selectedToken}
                numberOfTransactions={this.state.numberOfTransactions}
                tokenSelectChanged={this.onTokenSelectChanged}
              />
              <AddressHistory
                address={this.state.address}
                onRowClicked={this.onRowClicked}
                pagination={this.pagination}
                selectedToken={this.state.selectedToken}
                transactions={this.state.transactions}
                hasAfter={this.state.hasAfter}
                hasBefore={this.state.hasBefore}
              />
            </div>
          );
        }
      }
    }

    return (
      <div className="content-wrapper">
        {renderData()}
      </div>
    );
  }
}

export default AddressDetail;