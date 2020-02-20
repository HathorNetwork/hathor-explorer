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
import PaginationURL from '../utils/pagination';


class AddressSummary extends React.Component {
  /**
   * balance {Object} Object with balance of each token of this address indexed by tokenUid {uid1: {'received', 'spent'}}
   * loading {boolean} If is waiting server response
   * errorMessage {String} Message to be shown in case of an error
   * selectedToken {String} UID of the selected token when address has many
   * numberOfTransactions {Number} Total number of transactions of the list
   */
  state = {
    balance: {},
    loading: true,
    errorMessage: '',
    selectedToken: '',
    numberOfTransactions: 0,
  }

  componentDidMount() {
    const queryParams = this.props.pagination.obtainQueryParams();
    if (queryParams.token !== null) {
      // User already have a token selected on the URL
      this.setState({ selectedToken: queryParams.token }, () => {
        this.getData();
      });
    } else {
      // Will get data and select the default token
      this.getData();
    }

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps) {
    if (this.props.address !== prevProps.address) {
      // Address changed, must update data
      this.props.pagination.clearOptionalQueryParams();
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
      if (this.props.shouldUpdate(wsData, false)) {
        this.getData();
      }
    }
  }

  /**
   * Request data from server and update state balance
   */
  getData() {
    hathorLib.walletApi.getAddressBalance(this.props.address, (response) => {
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
            selectedToken = response.tokens_data[keys[0]];
          }
        }

        // Update token in the URL
        this.updateTokenURL(selectedToken);

        this.setState({
          balance: response.tokens_data,
          loading: false,
          selectedToken,
        });
      } else {
        this.setState({
          loading: false,
          errorMessage: response.message,
        });
      }
    });
  }

  /**
   * Called when selected token is changed
   *
   * @param {Object} e Event emitted when select is changed
   */
  selectChanged = (e) => {
    this.setState({ selectedToken: e.target.value });
    this.updateTokenURL(e.target.value);
  }

  updateTokenURL = (token) => {
    const queryParams = this.props.pagination.obtainQueryParams();
    queryParams.token = token;
    const newURL = this.props.pagination.paginationUrl(queryParams);
    this.props.pushNewURL(newURL);
  }

  updateNumberOfTransactions = (numberOfTransactions) => {
    this.setState({ numberOfTransactions });
  }

  render() {
    if (Object.keys(this.state.balance).length === 0) {
      if (this.state.loading) {
        return null;
      }
    }

    const loadMainInfo = () => {
      return (
        <div className="card text-white bg-dark mb-3">
          <div className="card-body">
            Address: {this.props.address}<br />
            Number of tokens: {Object.keys(this.state.balance).length}
          </div>
        </div>
      );
    }

    const loadBalanceInfo = () => {
      const balance = this.state.balance[this.state.selectedToken];
      return (
        <div className="card bg-light mb-3">
          <div className="card-body">
            Token: {renderTokenData()}<br />
            Number of transactions: {this.state.numberOfTransactions}<br />
            Total received: {hathorLib.helpers.prettyValue(balance.received)}<br />
            Total spent: {hathorLib.helpers.prettyValue(balance.spent)}<br />
            <strong>Final balance: </strong>{hathorLib.helpers.prettyValue(balance.received - balance.spent)}
          </div>
        </div>
      );
    }

    const renderTokenData = () => {
      if (Object.keys(this.state.balance).length === 1) {
        const balance = this.state.balance[this.state.selectedToken];
        return <span>{balance.name} ({balance.symbol})</span>
      } else {
        return (
          <select value={this.state.selectedToken} onChange={this.selectChanged}>
            {renderTokenOptions()}
          </select>
        );
      }
    }

    const renderTokenOptions = () => {
      return Object.keys(this.state.balance).map((uid) => {
        const tokenData = this.state.balance[uid];
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
        {this.state.loading ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadSummary()}
        <p className="text-danger mt-3">{this.state.errorMessage}</p>
      </div>
    );
  }
}

/*
 * address: Address to show summary
 * shouldUpdate: Function that receives a tx data and returns if summary should be updated
 * pagination: Instance of pagination class that handles the URL parameters
 */
AddressSummary.propTypes = {
  address: PropTypes.string.isRequired,
  shouldUpdate: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
};

export default AddressSummary;