/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AddressSummary from '../components/AddressSummary';
import AddressHistory from '../components/AddressHistory';
import hathorLib from '@hathor/wallet-lib';


class AddressDetail extends React.Component {
  // TODO Add state comments
  state = {
    address: null,
    errorMessage: '',
  }

  componentDidMount() {
    const address = this.props.match.params.address;
    if (hathorLib.transaction.isAddressValid(address)) {
      this.setState({ address });
    } else {
      this.setState({ errorMessage: 'Invalid address.' });
    }
  }

  /**
   * TODO
   *
   * @param {Object} tx Transaction data received in the websocket
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  shouldUpdate = (tx) => {
    // TODO Check if tx has the searched address
    return true;
  }

  /*
   * Method called when updating the list with new data
   * Call the API of transactions list
   *
   * @param {number} timestamp Timestamp reference of the pagination
   * @param {string} hash Hash reference of the pagination
   * @param {string} page Button clicked in the pagination ('previous' or 'next')
   *
   * @return {Promise} Promise to be resolved when new data arrives
   */
  updateData = (hash) => {
    return hathorLib.walletApi.getAddressHistory([this.state.address], hash);
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
            <AddressSummary address={this.state.address} shouldUpdate={this.shouldUpdate} />
            <AddressHistory address={this.state.address} shouldUpdate={this.shouldUpdate} updateData={this.updateData} />
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