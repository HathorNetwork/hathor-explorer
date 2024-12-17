/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import dateFormatter from '../utils/date';
import PaginationURL from '../utils/pagination';
import SortableTable from './SortableTable';
import EllipsiCell from './EllipsiCell';
import { ReactComponent as RowBottomIcon } from '../assets/images/leading-icon.svg';
import { ReactComponent as RowTopIcon } from '../assets/images/leading-top-icon.svg';
import { COLORS } from '../constants';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

class AddressHistory extends SortableTable {
  /**
   * Check if the tx has only inputs and outputs that are authorities in the search address
   *
   * @param {Object} tx Transaction data
   *
   * @return {boolean} If the tx has only authority in the search address
   */
  isAllAuthority = tx => {
    for (const txin of tx.inputs) {
      if (
        !hathorLib.transactionUtils.isAuthorityOutput(txin) &&
        txin.decoded.address === this.props.address
      ) {
        return false;
      }
    }

    for (const txout of tx.outputs) {
      if (
        !hathorLib.transactionUtils.isAuthorityOutput(txout) &&
        txout.decoded.address === this.props.address
      ) {
        return false;
      }
    }

    return true;
  };

  renderTable(content) {
    return this.props.newUiEnabled ? (
      <table className=" table-stylized table-address">{content}</table>
    ) : (
      <table className="table table-striped address-history" id="tx-table">
        {content}
      </table>
    );
  }

  renderTableHead() {
    return this.props.newUiEnabled ? (
      <tr>
        <th>Type</th>
        <th>Hash</th>
        <th className="th-table-token-mobile">Timestamp</th>
        <th className="th-table-token-mobile"></th>
        <th className="th-table-token-mobile">Value</th>
      </tr>
    ) : (
      <tr>
        <th className="d-none d-lg-table-cell">Type</th>
        <th className="d-none d-lg-table-cell">Hash</th>
        <th className="d-none d-lg-table-cell">Timestamp</th>
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
    );
  }

  renderValue(value) {
    if (!this.props.metadataLoaded) {
      return 'Loading...';
    }

    return hathorLib.numberUtils.prettyValue(
      value,
      this.props.isNFT ? 0 : this.props.decimalPlaces
    );
  }

  renderTableBodyUi() {
    return this.props.data.map(tx => {
      let statusElement = '';
      let trClass = '';
      let prettyValue = this.renderValue(tx.balance);

      if (tx.balance > 0) {
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
      } else if (tx.balance < 0) {
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
      } else if (this.props.txCache[tx.tx_id]) {
        if (this.isAllAuthority(this.props.txCache[tx.tx_id])) {
          statusElement = <span>Authority</span>;
          prettyValue = '--';
        }
      }

      if (!this.props.metadataLoaded) {
        // We don't show green/red info while metadata is not loaded
        trClass = '';
      }
      return (
        <tr key={tx.tx_id} className={trClass} onClick={_e => this.props.onRowClicked(tx.tx_id)}>
          <td className="d-none d-lg-table-cell pe-3">
            {hathorLib.transactionUtils.getTxType(tx)}
          </td>
          <td className="d-none d-lg-table-cell pe-3">
            {hathorLib.helpersUtils.getShortHash(tx.tx_id)}
          </td>
          <td className="d-none d-lg-table-cell pe-3">
            {dateFormatter.parseTimestamp(tx.timestamp)}
          </td>
          <td className="state">{statusElement}</td>
          <td className="value">
            <span>{prettyValue}</span>
          </td>
          <td className="d-lg-none d-table-cell pe-3" colSpan="3">
            {hathorLib.transactionUtils.getTxType(tx)}
            <br />
            {hathorLib.helpersUtils.getShortHash(tx.tx_id)}
            <br />
            {dateFormatter.parseTimestamp(tx.timestamp)}
          </td>
        </tr>
      );
    });
  }

  renderNewTableBodyUi() {
    return this.props.data.map(tx => {
      let statusElement = '';
      let trClass = '';
      let prettyValue = this.renderValue(tx.balance);

      if (tx.balance > 0) {
        if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
          statusElement = (
            <span className="type-span span-green-tag">
              <RowBottomIcon /> Token creation
            </span>
          );
        } else {
          statusElement = (
            <span className="type-span span-green-tag">
              <RowBottomIcon /> Received
            </span>
          );
        }
        trClass = 'output-tr';
      } else if (tx.balance < 0) {
        if (tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION) {
          statusElement = (
            <span className="type-span span-red-tag">
              <RowTopIcon /> Token deposit
            </span>
          );
        } else {
          statusElement = (
            <span className="type-span span-red-tag">
              <RowTopIcon /> Sent
            </span>
          );
        }
        trClass = 'input-tr';
      } else if (this.props.txCache[tx.tx_id]) {
        if (this.isAllAuthority(this.props.txCache[tx.tx_id])) {
          statusElement = <span>Authority</span>;
          prettyValue = '--';
        }
      }

      if (!this.props.metadataLoaded) {
        // We don't show green/red info while metadata is not loaded
        trClass = '';
      }
      return (
        <tr key={tx.tx_id} className={trClass} onClick={_e => this.props.onRowClicked(tx.tx_id)}>
          <td className="pe-3">{hathorLib.transactionUtils.getTxType(tx)}</td>
          <td className="pe-3">
            <EllipsiCell id={tx.tx_id} />
          </td>
          <td className="pe-3 td-mobile date-cell">
            {dateFormatter.parseTimestampNewUi(tx.timestamp)}
          </td>
          <td className="state td-mobile">{statusElement}</td>
          <td className="value td-mobile">
            <span style={{ color: tx.balance < 0 ? COLORS.danger : COLORS.success }}>
              {prettyValue}
            </span>
          </td>
        </tr>
      );
    });
  }

  renderTableBody() {
    return this.props.newUiEnabled ? this.renderNewTableBodyUi() : this.renderTableBodyUi();
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
  ...SortableTable.propTypes,
  address: PropTypes.string.isRequired,
  onRowClicked: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
  selectedToken: PropTypes.string.isRequired,
  numTransactions: PropTypes.number.isRequired,
  txCache: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(AddressHistory);
