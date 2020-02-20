/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AddressSummary from '../components/AddressSummary';
import AddressHistory from '../components/AddressHistory';
import { transaction, walletApi } from '@hathor/wallet-lib';
import PaginationURL from '../utils/pagination';


class AddressDetail extends React.Component {
  pagination = new PaginationURL({
    'hash': {required: false},
    'page': {required: false},
    'token': {required: true}
  });

  addressSummaryRef = React.createRef();

  /*
   * address {String} searched address (from url)
   * errorMessage {String} message to be shown in case of an error
   */
  state = {
    address: null,
    errorMessage: '',
  }

  componentDidMount() {
    // Expects address on URL
    this.updateAddress(this.props.match.params.address);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.address !== this.props.match.params.address) {
      // Address on the URL changed
      this.updateAddress(this.props.match.params.address);
    }
  }

  /**
   * Check if address is valid and then update the state
   * If not valid show error message
   *
   * @param {Object} address New searched address to update state
   */
  updateAddress = (address) => {
    if (transaction.isAddressValid(address)) {
      this.setState({ address });
    } else {
      this.setState({ errorMessage: 'Invalid address.' });
    }
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
   * Update window URL without reloading the page
   *
   * @param {String} url New url
   */
  pushNewURL = (url) => {
    this.props.history.push(url);
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
        return (
          <div>
            <AddressSummary address={this.state.address} shouldUpdate={this.shouldUpdate} pagination={this.pagination} ref={this.addressSummaryRef} pushNewURL={this.pushNewURL} />
            <AddressHistory address={this.state.address} shouldUpdate={this.shouldUpdate} onRowClicked={this.onRowClicked} pagination={this.pagination} addressSummaryRef={this.addressSummaryRef} updateNumberOfTransactions={(value) => this.addressSummaryRef.current.updateNumberOfTransactions(value) } />
          </div>
        );
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