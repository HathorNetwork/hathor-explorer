/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import dateFormatter from '../utils/date';
import hathorLib, { numberUtils } from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import PaginationURL from '../utils/pagination';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

class AddressHistory extends React.Component {
  /**
   * We get the final balance of one tx of the list
   *
   * @param {Object} tx Transaction data
   *
   * @return {Number} Final tx balance value (can be negative value, in case we spent more than received for the search address)
   */
  calculateAddressBalance = tx => {
    const token = this.props.selectedToken;
    let value = 0;

    for (let txin of tx.inputs) {
      if (txin.token === token && txin.decoded.address === this.props.address) {
        if (!hathorLib.transactionUtils.isAuthorityOutput(txin)) {
          value -= txin.value;
        }
      }
    }

    for (let txout of tx.outputs) {
      if (txout.token === token && txout.decoded.address === this.props.address) {
        if (!hathorLib.transactionUtils.isAuthorityOutput(txout)) {
          value += txout.value;
        }
      }
    }

    return value;
  };

  /**
   * Check if the tx has only inputs and outputs that are authorities in the search address
   *
   * @param {Object} tx Transaction data
   *
   * @return {boolean} If the tx has only authority in the search address
   */
  isAllAuthority = tx => {
    for (let txin of tx.inputs) {
      if (
        !hathorLib.transactionUtils.isAuthorityOutput(txin) &&
        txin.decoded.address === this.props.address
      ) {
        return false;
      }
    }

    for (let txout of tx.outputs) {
      if (
        !hathorLib.transactionUtils.isAuthorityOutput(txout) &&
        txout.decoded.address === this.props.address
      ) {
        return false;
      }
    }

    return true;
  };

  render() {
    if (this.props.transactions.length === 0) {
      return <p>This address does not have any transactions yet.</p>;
    }

    const getFirstHash = () => {
      return this.props.transactions[0].tx_id;
    };

    const getLastHash = () => {
      return this.props.transactions[this.props.transactions.length - 1].tx_id;
    };

    const loadPagination = () => {
      if (this.props.transactions.length === 0) {
        return null;
      } else {
        return (
          <nav aria-label="Tx pagination" className="d-flex justify-content-center">
            <ul className="pagination">
              <li
                ref="txPrevious"
                className={!this.props.hasBefore ? 'page-item me-3 disabled' : 'page-item me-3'}
              >
                <Link
                  className="page-link"
                  to={this.props.pagination.setURLParameters({
                    hash: getFirstHash(),
                    page: 'previous',
                  })}
                >
                  Previous
                </Link>
              </li>
              <li
                ref="txNext"
                className={!this.props.hasAfter ? 'page-item disabled' : 'page-item'}
              >
                <Link
                  className="page-link"
                  to={this.props.pagination.setURLParameters({ hash: getLastHash(), page: 'next' })}
                >
                  Next
                </Link>
              </li>
            </ul>
          </nav>
        );
      }
    };

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
                <th className="d-none d-lg-table-cell"></th>
                <th className="d-none d-lg-table-cell">Value</th>
                <th className="d-table-cell d-lg-none" colSpan="3">
                  Type
                  <br />
                  Hash
                  <br />
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>{loadTableBody()}</tbody>
          </table>
        </div>
      );
    };

    const renderValue = value => {
      if (!this.props.metadataLoaded) {
        return 'Loading...';
      }

      return numberUtils.prettyValue(value, this.props.isNFT ? 0 : this.props.decimalPlaces);
    };

    const loadTableBody = () => {
      return this.props.transactions.map((tx, idx) => {
        const value = this.calculateAddressBalance(tx);
        let statusElement = '';
        let trClass = '';
        let prettyValue = renderValue(value);
        if (value > 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = (
              <span>
                Token creation <i className={`fa ms-3 fa-long-arrow-down`}></i>
              </span>
            );
          } else {
            statusElement = (
              <span>
                Received <i className={`fa ms-3 fa-long-arrow-down`}></i>
              </span>
            );
          }
          trClass = 'output-tr';
        } else if (value < 0) {
          if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
            statusElement = (
              <span>
                Token deposit <i className={`fa ms-3 fa-long-arrow-up`}></i>
              </span>
            );
          } else {
            statusElement = (
              <span>
                Sent <i className={`fa ms-3 fa-long-arrow-up`}></i>
              </span>
            );
          }
          trClass = 'input-tr';
        } else {
          if (this.isAllAuthority(tx)) {
            statusElement = <span>Authority</span>;
            prettyValue = '--';
          }
        }

        if (!this.props.metadataLoaded) {
          // We don't show green/red info while metadata is not loaded
          trClass = '';
        }

        return (
          <tr key={tx.tx_id} className={trClass} onClick={e => this.props.onRowClicked(tx.tx_id)}>
            <td className="d-none d-lg-table-cell pr-3">
              {hathorLib.transactionUtils.getTxType(tx)}
            </td>
            <td className="d-none d-lg-table-cell pr-3">
              {hathorLib.helpersUtils.getShortHash(tx.tx_id)}
            </td>
            <td className="d-none d-lg-table-cell pr-3">
              {dateFormatter.parseTimestamp(tx.timestamp)}
            </td>
            <td className={tx.is_voided ? 'voided state' : 'state'}>{statusElement}</td>
            <td>{tx.is_voided && <span className="voided-element">Voided</span>}</td>
            <td className="value">
              <span className={tx.is_voided ? 'voided' : ''}>{prettyValue}</span>
            </td>
            <td className="d-lg-none d-table-cell pr-3" colSpan="3">
              {hathorLib.transactionUtils.getTxType(tx)}
              <br />
              {hathorLib.helpersUtils.getShortHash(tx.tx_id)}
              <br />
              {dateFormatter.parseTimestamp(tx.timestamp)}
            </td>
          </tr>
        );
      });
    };

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
 * transactions: Array of transactions to show in the history
 * hasAfter: If has a page after to fetch new history
 * hasBefore: If has a page before to fetch history
 */
AddressHistory.propTypes = {
  address: PropTypes.string.isRequired,
  onRowClicked: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
  selectedToken: PropTypes.string.isRequired,
  transactions: PropTypes.array.isRequired,
  hasAfter: PropTypes.bool.isRequired,
  hasBefore: PropTypes.bool.isRequired,
};

export default connect(mapStateToProps)(AddressHistory);
