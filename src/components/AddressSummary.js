/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';


class AddressSummary extends React.Component {
  /**
   * Called when selected token is changed
   *
   * @param {Object} e Event emitted when select is changed
   */
  selectChanged = (e) => {
    this.props.tokenSelectChanged(e.target.value);
  }

  render() {
    if (Object.keys(this.props.balance).length === 0) {
      return null;
    }

    const loadMainInfo = () => {
      return (
        <div className="card text-white bg-dark mb-3">
          <div className="card-body">
            Address: {this.props.address}<br />
            Number of tokens: {Object.keys(this.props.balance).length}
          </div>
        </div>
      );
    }

    const loadBalanceInfo = () => {
      const balance = this.props.balance[this.props.selectedToken];
      return (
        <div className="card bg-light mb-3">
          <div className="card-body">
            Token: {renderTokenData()}<br />
            Number of transactions: {this.props.numberOfTransactions}<br />
            Total received: {hathorLib.helpers.prettyValue(balance.received)}<br />
            Total spent: {hathorLib.helpers.prettyValue(balance.spent)}<br />
            <strong>Final balance: </strong>{hathorLib.helpers.prettyValue(balance.received - balance.spent)}
          </div>
        </div>
      );
    }

    const renderTokenData = () => {
      if (Object.keys(this.props.balance).length === 1) {
        const balance = this.props.balance[this.props.selectedToken];
        return <span>{balance.name} ({balance.symbol})</span>
      } else {
        return (
          <select value={this.props.selectedToken} onChange={this.selectChanged}>
            {renderTokenOptions()}
          </select>
        );
      }
    }

    const renderTokenOptions = () => {
      return Object.keys(this.props.balance).map((uid) => {
        const tokenData = this.props.balance[uid];
        return <option value={uid} key={uid}>{tokenData.name} ({tokenData.symbol})</option>;
      });
    }

    const loadSummary = () => {
      return (
        <div>
          {loadMainInfo()}
          {loadBalanceInfo()}
        </div>
      );
    }

    return (
      <div className="w-100">
        {loadSummary()}
      </div>
    );
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

export default AddressSummary;