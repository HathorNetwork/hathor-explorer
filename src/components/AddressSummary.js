/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import {TX_COUNT} from '../constants';
import TxRow from './TxRow';
import helpers from '../utils/helpers';
import WebSocketHandler from '../WebSocketHandler';
import colors from '../index.scss';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';


class AddressSummary extends React.Component {
  /**
   * balance {Object} Object with balance of each token of this address indexed by tokenUid {uid1: {'received', 'spent'}}
   * quantity {number} Number of transactions in this address
   * loading {boolean} If is waiting server response
   * errorMessage {String} Message to be shown in case of an error
   */
  state = {
    balance: {},
    quantity: null,
    loading: true,
    errorMessage: '',
  }

  componentDidMount() {
    this.getData();

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps) {
    if (this.props.address !== prevProps.address) {
      // Address changed, must update date
      this.getData();
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
      if (this.props.shouldUpdate(wsData)) {
        this.getData();
      }
    }
  }

  /**
   * Request data from server and update state balance and quantity
   */
  getData() {
    hathorLib.walletApi.getAddressBalance(this.props.address, (response) => {
      if (response.success) {
        this.setState({
          balance: response.tokens_data,
          quantity: response.quantity,
          loading: false,
        });
      } else {
        this.setState({
          loading: false,
          errorMessage: response.message,
        });
      }
    });
  }

  render() {
    const loadMainInfo = () => {
      return (
        <div className="card text-white bg-dark mb-3">
          <div className="card-body">
            Address: {this.props.address}<br />
            Number of transactions: {this.state.quantity}
          </div>
        </div>
      );
    }

    const loadBalanceInfo = () => {
      return Object.keys(this.state.balance).map((key) => {
        return loadOneTokenBalance(key);
      });
    }

    const loadOneTokenBalance = (uid) => {
      const balance = this.state.balance[uid];
      return (
        <div className="card bg-light mb-3" key={uid}>
          <div className="card-body">
            Token: {balance.name} ({balance.symbol})<br />
            Total received: {hathorLib.helpers.prettyValue(balance.received)}<br />
            Total spent: {hathorLib.helpers.prettyValue(balance.spent)}<br />
            Final balance: {hathorLib.helpers.prettyValue(balance.received - balance.spent)}
          </div>
        </div>
      );
    }

    const loadSummary = () => {
      if (this.state.quantity === null) return null;

      return (
        <div>
          {loadMainInfo()}
          {loadBalanceInfo()}
        </div>
      );
    }

    return (
      <div className="w-100">
        {this.state.loading ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadSummary()}
        <p className="text-danger mt-3">{this.state.errorMessage}</p>
      </div>
    );
  }
}

/*
 * address: Address to show summary
 * shouldUpdate: Function that receives a tx data and returns if summary should be updated
 */
AddressSummary.propTypes = {
  address: PropTypes.string.isRequired,
  shouldUpdate: PropTypes.func.isRequired,
};

export default AddressSummary;