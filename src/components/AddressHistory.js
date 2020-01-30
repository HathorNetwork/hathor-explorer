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
import dateFormatter from '../utils/date';
import helpers from '../utils/helpers';
import WebSocketHandler from '../WebSocketHandler';
import colors from '../index.scss';
import hathorLib from '@hathor/wallet-lib';


class AddressHistory extends React.Component {
  // TODO Should update on props change (on address change)
  // TODO add proptypes
  // TODO comments about each state
  state = {
    transactions: [],
    loading: true,
  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    hathorLib.wallet.getHistory([this.props.address]).then((transactions) => {
      this.setState({ transactions, loading: false });
    }, (e) => {
      // TODO handle show error
      console.log(e);
    });
  }

  handleClickTr = (hash) => {
    this.props.history.push(`/transaction/${hash}`);
  }

  render() {
    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Type</th>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-table-cell d-lg-none" colSpan="3">Type<br/>Hash<br/>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loadTableBody()}
            </tbody>
          </table>
        </div>
      );
    }

    const loadTableBody = () => {
      return this.state.transactions.map((tx, idx) => {
        return (
          <tr key={tx.tx_id} onClick={(e) => this.handleClickTr(tx.tx_id)}>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getTxType(tx)}</td>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(tx.tx_id)}</td>
            <td className="d-none d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td className="d-lg-none d-table-cell pr-3" colSpan="3">{hathorLib.helpers.getTxType(tx)}<br/>{hathorLib.helpers.getShortHash(tx.tx_id)}<br/>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
          </tr>
        );
      });
    }

    return (
      <div className="w-100">
        {this.state.loading ? <ReactLoading type='spin' color={colors.purpleHathor} delay={500} /> : loadTable()}
      </div>
    );
  }
}

export default AddressHistory;
