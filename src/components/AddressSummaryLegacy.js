/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { numberUtils } from '@hathor/wallet-lib';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

class AddressSummary extends React.Component {
  /**
   * Called when selected token is changed
   *
   * @param {Object} e Event emitted when select is changed
   */
  selectChanged = e => {
    this.props.tokenSelectChanged(e.target.value);
  };

  render() {
    if (Object.keys(this.props.balance).length === 0) {
      return null;
    }

    const loadMainInfo = () => {
      return (
        <div className="card text-white bg-dark mb-3">
          <div className="card-body">
            Address: {this.props.address}
            <br />
            Number of tokens: {Object.keys(this.props.balance).length}
          </div>
        </div>
      );
    };

    // We show 'Loading' until all metadatas are loaded
    // to prevent switching from decimal to integer if one of the tokens is an NFT
    const renderType = () => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      if (this.props.isNFT) {
        return 'NFT';
      } else {
        return 'Custom token';
      }
    };

    const renderValue = value => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      return numberUtils.prettyValue(value, this.props.isNFT ? 0 : this.props.decimalPlaces);
    };

    const loadBalanceInfo = () => {
      const balance = this.props.balance[this.props.selectedToken];
      return (
        <div className="card bg-light mb-3">
          <div className="card-body">
            Token: {renderTokenData()}
            <br />
            Type: {renderType()}
            <br />
            Number of transactions: {this.props.numberOfTransactions}
            <br />
            Total received: {renderValue(balance.received)}
            <br />
            Total spent: {renderValue(balance.spent)}
            <br />
            <strong>Final balance: </strong>
            {renderValue(balance.received - balance.spent)}
          </div>
        </div>
      );
    };

    const renderTokenData = () => {
      if (Object.keys(this.props.balance).length === 1) {
        const balance = this.props.balance[this.props.selectedToken];
        return (
          <span>
            {balance.name} ({balance.symbol})
          </span>
        );
      } else {
        return (
          <select value={this.props.selectedToken} onChange={this.selectChanged}>
            {renderTokenOptions()}
          </select>
        );
      }
    };

    const renderTokenOptions = () => {
      return Object.keys(this.props.balance).map(uid => {
        const tokenData = this.props.balance[uid];
        return (
          <option value={uid} key={uid}>
            {tokenData.name} ({tokenData.symbol})
          </option>
        );
      });
    };

    const loadSummary = () => {
      return (
        <div>
          {loadMainInfo()}
          {loadBalanceInfo()}
        </div>
      );
    };

    return <div className="w-100">{loadSummary()}</div>;
  }
}

/*
 * address: Address to show summary
 * balance: Object with balance data of each token for the selected address {'uid': {name, symbol, received, spent}}
 * selectedToken: UID of the selected token to show history
 * numberOfTransactions: Number of transactions for the selected token and address
 * tokenSelectChanged: Callback to be executed when user changes token
 */
AddressSummary.propTypes = {
  address: PropTypes.string.isRequired,
  balance: PropTypes.object.isRequired,
  selectedToken: PropTypes.string.isRequired,
  numberOfTransactions: PropTypes.number.isRequired,
  tokenSelectChanged: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(AddressSummary);
