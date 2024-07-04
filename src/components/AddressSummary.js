/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { numberUtils, constants as hathorLibConstants } from '@hathor/wallet-lib';
import { connect } from 'react-redux';


const mapStateToProps = (state) => {
  return {
    decimalPlaces: state.serverInfo?.decimal_places ?? hathorLibConstants.DECIMAL_PLACES,
  };
};

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
    if (Object.keys(this.props.tokens).length === 0) {
      return null;
    }

    const loadMainInfo = () => {
      return (
        <div className="card text-white bg-dark mb-3">
          <div className="card-body">
            Address: {this.props.address}<br />
            Number of tokens: {Object.keys(this.props.tokens).length}
          </div>
        </div>
      );
    }

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
    }

    const renderValue = (value) => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      return numberUtils.prettyValue(value, this.props.isNFT ? 0 : this.props.decimalPlaces);
    }

    const loadBalanceInfo = () => {
      return (
        <div className="card bg-light mb-3">
          <div className="card-body">
            Token: {renderTokenData()}<br />
            Type: {renderType()}<br />
            Number of transactions: {this.props.balance.transactions}<br />
            Total received: {renderValue(this.props.balance.total_received)}<br />
            Total spent: {renderValue(this.props.balance.total_received - this.props.balance.unlocked_balance - this.props.balance.locked_balance)}<br />
            <strong>Unlocked balance: </strong>{renderValue(this.props.balance.unlocked_balance)}<br/>
            <strong>Locked balance: </strong>{renderValue(this.props.balance.locked_balance)}
          </div>
        </div>
      );
    }

    const renderTokenData = () => {
      if (Object.keys(this.props.tokens).length === 1) {
        const token = this.props.tokens[this.props.selectedToken];
        return <span>{token.name} ({token.symbol})</span>
      } else {
        return (
          <select value={this.props.selectedToken} onChange={this.selectChanged}>
            {renderTokenOptions()}
          </select>
        );
      }
    }

    const renderTokenOptions = () => {
      return Object.keys(this.props.tokens).map((uid) => {
        const token = this.props.tokens[uid];
        return <option value={uid} key={uid}>{token.name} ({token.symbol})</option>;
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
 * tokens: Object with tokens the address has a history with.
 * balance: Object with balance data of each token for the selected address {'uid': {name, symbol, received, spent}}
 * selectedToken: UID of the selected token to show history
 * tokenSelectChanged: Callback to be executed when user changes token
 */
AddressSummary.propTypes = {
  address: PropTypes.string.isRequired,
  tokens: PropTypes.object.isRequired,
  balance: PropTypes.object.isRequired,
  selectedToken: PropTypes.string.isRequired,
  tokenSelectChanged: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(AddressSummary);
