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


class AddressSummary extends React.Component {
  // TODO Should update on props change (on address change)
  // TODO add propTypes with address
  // TODO add state comments
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

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      if (this.props.shouldUpdate(wsData)) {
        this.getData();
      }
    }
  }

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
      console.log('Load one token', this.state.balance);
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

export default AddressSummary;