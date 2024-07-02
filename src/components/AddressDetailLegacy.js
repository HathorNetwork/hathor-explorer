/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AddressSummaryLegacy from './AddressSummaryLegacy';
import AddressHistoryLegacy from './AddressHistoryLegacy';
import PaginationURL from '../utils/pagination';
import hathorLib from '@hathor/wallet-lib';
import ReactLoading from 'react-loading';
import colors from '../index.scss';
import WebSocketHandler from '../WebSocketHandler';
import { TX_COUNT } from '../constants';
import { isEqual } from 'lodash';
import helpers from '../utils/helpers';
import metadataApi from '../api/metadataApi';
import addressApiLegacy from '../api/addressApiLegacy';


class AddressDetailLegacy extends React.Component {
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
   * warningRefreshPage {boolean} If should show a warning to refresh the page to see newest data for the address
   * selectedTokenMetadata {Object} Metadata of the selected token
   * metadataLoaded {boolean} When the selected token metadata was loaded
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
    warningRefreshPage: false,
    selectedTokenMetadata: null,
    metadataLoaded: false,
  }

  componentDidMount() {
    // Expects address on URL
    this.updateAddress(this.props.match.params.address);

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
        // Need to get newQueryParams because the optional ones were cleared
        // Update state to set the new selected token on it
        // If we don't update this state here we might execute a duplicate request
        const newQueryParams = this.pagination.obtainQueryParams();
        this.setState({ queryParams: newQueryParams }, () => {
          this.getHistoryData(newQueryParams);
        });
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
      if (this.shouldUpdate(wsData, false) && !this.state.warningRefreshPage) {
        // If the search address is in one of the inputs or outputs
        this.setState({ warningRefreshPage: true });
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
    this.setState({ queryParams: this.pagination.obtainQueryParams() }, () => {
      const network = hathorLib.config.getNetwork();
      const addressObj = new hathorLib.Address(address, { network });
      if (addressObj.isValid()) {
        this.setState({ address, loadingSummary: true, transactions: [], errorMessage: '' }, () => {
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
    });
  }

  /**
   * Update transactions data state after requesting data from the server
   *
   * @param {Object} queryParams URL parameters
   */
  getHistoryData = (queryParams) => {
    addressApiLegacy.search(this.state.address, TX_COUNT, queryParams.hash, queryParams.page, queryParams.token).then((response) => {
      if (response.success) {
        this.handleFetchedData(response, queryParams);
      }
      // fetch metadata for selected token
      this.getSelectedTokenMetadata(queryParams.token);
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
    addressApiLegacy.getBalance(this.state.address).then((response) => {
      if (response.success) {
        let selectedToken = '';
        if (this.state.selectedToken && this.state.selectedToken in response.tokens_data) {
          // If user had selected a token already, should continue the same
          selectedToken = this.state.selectedToken;
        } else {
          const hathorUID = hathorLib.constants.NATIVE_TOKEN_UID
          if (hathorUID in response.tokens_data) {
            // If HTR is in the token list of this address, it's the default selection
            selectedToken = hathorUID;
          } else {
            // Otherwise we get the first element, if there is one
            const keys = Object.keys(response.tokens_data);
            if (keys.length === 0) {
              // In case the length is 0, we have no transactions for this address
              this.setState({ loadingSummary: false });
              return;
            }
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

        this.getSelectedTokenMetadata(selectedToken);
      } else {
        this.setState({
          loadingSummary: false,
          errorMessage: response.message,
        });
      }
    });
  }

  getSelectedTokenMetadata = (selectedToken) => {
    metadataApi.getDagMetadata(selectedToken).then((data) => {
      if (data) {
        this.setState({ selectedTokenMetadata: data });
      }
      this.setState({ metadataLoaded: true });
    });
  }

  /**
   * Callback to be executed when user changes token on select input
   *
   * @param {String} Value of the selected item
   */
  onTokenSelectChanged = (value) => {
    this.setState({ selectedToken: value, metadataLoaded: false, selectedTokenMetadata: null });
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

  /**
   * Refresh web page
   *
   * @param {Event} e Click event
   */
  refreshPage = (e) => {
    e.preventDefault();
    window.location.reload();
  }

  render() {
    const renderWarningAlert = () => {
      if (this.state.warningRefreshPage) {
        return (
          <div className="alert alert-warning refresh-alert" role="alert">
            There is a new transaction for this address. Please <a href="true" onClick={this.refreshPage}>refresh</a> the page to see the newest data.
          </div>
        );
      }

      return null;
    }

    const isNFT = () => {
      return this.state.selectedTokenMetadata && this.state.selectedTokenMetadata.nft;
    }

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
              {renderWarningAlert()}
              <AddressSummaryLegacy
                address={this.state.address}
                balance={this.state.balance}
                selectedToken={this.state.selectedToken}
                numberOfTransactions={this.state.numberOfTransactions}
                tokenSelectChanged={this.onTokenSelectChanged}
                isNFT={isNFT()}
                metadataLoaded={this.state.metadataLoaded}
              />
              <AddressHistoryLegacy
                address={this.state.address}
                onRowClicked={this.onRowClicked}
                pagination={this.pagination}
                selectedToken={this.state.selectedToken}
                transactions={this.state.transactions}
                hasAfter={this.state.hasAfter}
                hasBefore={this.state.hasBefore}
                isNFT={isNFT()}
                metadataLoaded={this.state.metadataLoaded}
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

export default AddressDetailLegacy;
