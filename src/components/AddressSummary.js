/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { numberUtils } from '@hathor/wallet-lib';
import { connect } from 'react-redux';
import HathorSelect from './HathorSelect';

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
    if (Object.keys(this.props.tokens).length === 0) {
      return null;
    }

    const newLoadMainInfo = () => {
      return (
        <div className="summary-main-info alter-background">
          <div className="summary-main-info-container ">
            <div className="address-container-title summary-container-title-purple">Address</div>
            <div className="address-div">{this.props.address}</div>
          </div>
          <div className="summary-main-info-container">
            <div className="address-container-title summary-container-title-purple">
              Number of tokens
            </div>
            <div>{Object.keys(this.props.tokens).length}</div>
          </div>
          <div className="summary-main-info-container">
            <div className="address-container-title  summary-container-title-purple">Token</div>
            {newRenderTokenData()}
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
      }
      return 'Custom token';
    };

    const renderValue = value => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      return numberUtils.prettyValue(value, this.props.isNFT ? 0 : this.props.decimalPlaces);
    };

    const newLoadBalanceInfo = () => {
      const token = this.props.tokens[this.props.selectedToken];
      return (
        <div className="summary-balance-info">
          <div className="summary-balance-info-container">
            <div className="address-container-title">Token</div>
            <div>{`${token.name} (${token.symbol})`}</div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Type</div>
            <div>{renderType()}</div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Number of transactions</div>
            <div>{this.props.balance.transactions}</div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Total received</div>
            <div>{renderValue(this.props.balance.total_received)}</div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Total spent</div>
            <div>
              {renderValue(
                this.props.balance.total_received -
                  this.props.balance.unlocked_balance -
                  this.props.balance.locked_balance
              )}
            </div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Unlocked balance</div>
            <div>{renderValue(this.props.balance.unlocked_balance)}</div>
          </div>
          <div className="summary-balance-info-container">
            <div className="address-container-title">Locked balance</div>
            <div>{renderValue(this.props.balance.locked_balance)}</div>
          </div>
        </div>
      );
    };

    const SelectToken = () => {
      const uid = Object.keys(this.props.tokens).find(key => key === this.props.selectedToken);

      if (uid) {
        const token = this.props.tokens[uid];

        return {
          key: uid,
          name: `${token.name} (${token.symbol})`,
        };
      }

      return null;
    };

    const newRenderTokenData = () => {
      if (Object.keys(this.props.tokens).length === 1) {
        const token = this.props.tokens[this.props.selectedToken];
        return (
          <span>
            {token.name} ({token.symbol})
          </span>
        );
      }
      return (
        <HathorSelect
          value={SelectToken()}
          options={newRenderTokenOptions()}
          onSelect={e => this.props.tokenSelectChanged(e)}
        />
      );
    };

    const newRenderTokenOptions = () => {
      return Object.keys(this.props.tokens).map(uid => {
        const token = this.props.tokens[uid];
        return {
          key: uid,
          name: `${token.name} (${token.symbol})`,
        };
      });
    };

    const newLoadSummary = () => {
      return (
        <div>
          {newLoadMainInfo()}
          {newLoadBalanceInfo()}
        </div>
      );
    };

    return <div className="w-100">{newLoadSummary()}</div>;
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
