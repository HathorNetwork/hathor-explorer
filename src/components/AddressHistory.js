/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import dateFormatter from '../utils/date';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import PaginationURL from '../utils/pagination';
import helpers from '../utils/helpers';
import { TX_COUNT } from '../constants';


class AddressHistory extends React.Component {

  /**
   * Check if the tx has only inputs and outputs that are authorities in the search address
   *
   * @param {Object} tx Transaction data
   *
   * @return {boolean} If the tx has only authority in the search address
   */
  isAllAuthority = (tx) => {
    for (let txin of tx.inputs) {
      if (!hathorLib.wallet.isAuthorityOutput(txin) && txin.decoded.address === this.props.address) {
        return false;
      }
    }

    for (let txout of tx.outputs) {
      if (!hathorLib.wallet.isAuthorityOutput(txout) && txout.decoded.address === this.props.address) {
        return false;
      }
    }

    return true;
  }

  render() {
    if (this.props.transactions.length === 0) {
      return <p>This address does not have any transactions yet.</p>
    }

    const paginationLink = (page, query) => {
        return this.props.pagination.setURLParameters({ ...query, page: page });
    }

    const loadPagination = () => {
      if (this.props.transactions.length === 0) {
        return null;
      }

      return null;
    }

    const loadTable = () => {
      return (
        <div className="table-responsive mt-5">
          <table className="table table-striped address-history" id="tx-table">
            <thead>
              <tr>
                <th className="d-none d-lg-table-cell">Type</th>
                <th className="d-none d-lg-table-cell">Hash</th>
                <th className="d-none d-lg-table-cell">Timestamp</th>
                <th className="d-none d-lg-table-cell"></th>
                <th className="d-none d-lg-table-cell">Value</th>
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

    const renderValue = (value) => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      return helpers.renderValue(value, this.props.isNFT);
    }

    const loadTableBody = () => {
      return this.props.transactions.map((tx, idx) => {
        let statusElement = '';
        let trClass = '';
        let prettyValue = renderValue(tx.balance);
        if (tx.balance > 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = <span>Token creation <i className={`fa ml-3 fa-long-arrow-down`}></i></span>;
          } else {
            statusElement = <span>Received <i className={`fa ml-3 fa-long-arrow-down`}></i></span>;
          }
          trClass = 'output-tr';
        } else if (tx.balance < 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = <span>Token deposit <i className={`fa ml-3 fa-long-arrow-up`}></i></span>
          } else {
            statusElement = <span>Sent <i className={`fa ml-3 fa-long-arrow-up`}></i></span>
          }
          trClass = 'input-tr';
        } else {
          if (this.props.txCache[tx.tx_id]) {
            if (this.isAllAuthority(this.props.txCache[tx.tx_id])) {
              statusElement = <span>Authority</span>;
              prettyValue = '--';
            }
          }
        }

        if (!this.props.metadataLoaded) {
          // We don't show green/red info while metadata is not loaded
          trClass = '';
        }

        return (
          <tr key={tx.tx_id} className={trClass} onClick={(e) => this.props.onRowClicked(tx.tx_id)}>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getTxType(tx)}</td>
            <td className="d-none d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(tx.tx_id)}</td>
            <td className="d-none d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td className="state">{statusElement}</td>
            <td className="value"><span className="">{prettyValue}</span></td>
            <td className="d-lg-none d-table-cell pr-3" colSpan="3">{hathorLib.helpers.getTxType(tx)}<br/>{hathorLib.helpers.getShortHash(tx.tx_id)}<br/>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
          </tr>
        );
      });
    }

    return (
      <div className="w-100">
        {loadTable()}
        {loadPagination()}
      </div>
    );
  }
}

/*
 * address: Address to show summary
 * onRowClicked: Function executed when user clicks on the table row (receives tx_id)
 * pagination: Instance of pagination class that handles the URL parameters
 * selectedToken: UID of the selected token to show history
 * transactions: Array of transaction balances to show in the history
 * numTransactions: total number of transactions
 * txCache: An object with the original txs in the transactions array
 */
AddressHistory.propTypes = {
  address: PropTypes.string.isRequired,
  onRowClicked: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
  selectedToken: PropTypes.string.isRequired,
  transactions: PropTypes.array.isRequired,
  numTransactions: PropTypes.number.isRequired,
  txCache: PropTypes.object.isRequired,
};


export default AddressHistory;
