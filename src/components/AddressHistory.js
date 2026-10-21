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
import ConfidentialBadge from './ConfidentialBadge';
import { describeHistoryRow } from '../utils/shieldedOutputs';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

class AddressHistory extends SortableTable {
  renderTable(content) {
    return <table className=" table-stylized table-address">{content}</table>;
  }

  renderTableHead() {
    return (
      <tr>
        <th>Type</th>
        <th>Hash</th>
        <th className="th-table-token-mobile">Timestamp</th>
        <th className="th-table-token-mobile"></th>
        <th className="th-table-token-mobile">Value</th>
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

  /**
   * Render the Value column for a row, as described by `describeHistoryRow`.
   */
  renderValueContent(tx, row) {
    if (row.value === 'loading') {
      return 'Loading...';
    }
    if (row.value === 'authority') {
      return '--';
    }

    const badge = <ConfidentialBadge amountOnly={row.amountOnly} />;
    if (row.value === 'confidential') {
      return <span className="confidential-value">{badge}</span>;
    }

    const valueSpan = (
      <span style={{ color: tx.balance < 0 ? COLORS.danger : COLORS.success }}>
        {this.renderValue(tx.balance)}
      </span>
    );
    if (row.value === 'public-and-confidential') {
      return (
        <>
          {valueSpan}
          <div className="confidential-value">+ {badge}</div>
        </>
      );
    }
    return valueSpan;
  }

  /**
   * Render the status column for a row, as described by `describeHistoryRow`.
   */
  renderStatus(tx, row) {
    if (row.authority) {
      return <span>Authority</span>;
    }

    // Token creation/deposit only apply to the public value of the row
    const isTokenCreation =
      row.value !== 'confidential' && tx.version === hathorLib.constants.CREATE_TOKEN_TX_VERSION;
    if (row.direction === 'received') {
      return (
        <span className="type-span span-green-tag">
          <RowBottomIcon /> {isTokenCreation ? 'Token creation' : 'Received'}
        </span>
      );
    }
    if (row.direction === 'sent') {
      return (
        <span className="type-span span-red-tag">
          <RowTopIcon /> {isTokenCreation ? 'Token deposit' : 'Sent'}
        </span>
      );
    }
    return '';
  }

  renderNewTableBodyUi(isMobile) {
    const ellipsisCount = isMobile ? 4 : 12;
    return this.props.data.map(tx => {
      // txCache holds undefined while a tx loads and null if its fetch failed
      const row = describeHistoryRow({
        balance: tx.balance,
        tx: this.props.txCache[tx.tx_id],
        address: this.props.address,
        token: this.props.selectedToken,
        nativeTokenUid: hathorLib.constants.NATIVE_TOKEN_UID,
        getTx: txId => this.props.txCache[txId],
      });

      let trClass = '';
      if (this.props.metadataLoaded && !row.authority) {
        // We don't show green/red info while metadata is not loaded
        if (row.direction === 'received') {
          trClass = 'output-tr';
        } else if (row.direction === 'sent') {
          trClass = 'input-tr';
        }
      }

      return (
        <tr key={tx.tx_id} className={trClass} onClick={_e => this.props.onRowClicked(tx.tx_id)}>
          <td className="pe-3">{hathorLib.transactionUtils.getTxType(tx)}</td>
          <td className="pe-3">
            <EllipsiCell id={tx.tx_id} countBefore={ellipsisCount} countAfter={ellipsisCount} />
          </td>
          <td className="pe-3 td-mobile date-cell">
            {dateFormatter.parseTimestampNewUi(tx.timestamp)}
          </td>
          <td className="state td-mobile">{this.renderStatus(tx, row)}</td>
          <td className="value td-mobile">{this.renderValueContent(tx, row)}</td>
        </tr>
      );
    });
  }

  renderTableBody() {
    return this.renderNewTableBodyUi(this.props.isMobile);
  }
}

/*
 * address: Address to show summary
 * onRowClicked: Function executed when user clicks on the table row (receives tx_id)
 * pagination: Instance of pagination class that handles the URL parameters
 * selectedToken: UID of the selected token to show history, null on the confidential history
 * transactions: Array of transaction balances to show in the history
 * numTransactions: total number of transactions
 * txCache: An object with the original txs in the transactions array
 */
AddressHistory.propTypes = {
  ...SortableTable.propTypes,
  address: PropTypes.string.isRequired,
  onRowClicked: PropTypes.func.isRequired,
  pagination: PropTypes.instanceOf(PaginationURL).isRequired,
  selectedToken: PropTypes.string,
  numTransactions: PropTypes.number,
  txCache: PropTypes.object.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default connect(mapStateToProps)(AddressHistory);
