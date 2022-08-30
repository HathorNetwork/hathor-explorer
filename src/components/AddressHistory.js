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

    /**
     * Generate an array of the pagination options for the user.
     * We want to show the current page, the 2 previous and 2 next pages (5 total)
     * We always show 5 options if possible with pages starting at 1.
     *
     * examples:
     * getPages(5, 10) -> [3, 4, 5, 6, 7];
     * getPages(2, 10) -> [1, 2, 3, 4, 5];
     * getPages(1, 10) -> [1, 2, 3, 4, 5];
     * getPages(9, 10) -> [6, 7, 8, 9, 10];
     * getPages(2, 3) -> [1, 2, 3];
     */
    const getPages = (page, total) => {
      let start = page - 2;
      let end = page + 2;
      if (start < 1) {
        // If the start is before 1, we push the end further
        end -= start;
        start = 1;
      }

      if (end > total) {
        // If the start is not 1, push start back (up to 1)
        start = start === 1 ? 1 : Math.max(start - end + total, 1);
        end = total;
      }

      return Array(1 + end - start).fill().map((_, index) => start + index);
    };

    const loadPagination = () => {
      if (this.props.transactions.length === 0) {
        return null;
      } else {
        const queryParams = this.props.pagination.obtainQueryParams();
        const page = +queryParams.page || 1;
        const lastPage = Math.ceil(this.props.numTransactions / TX_COUNT);
        const pages = getPages(page, lastPage);

        const pagesList = pages.map(index => (
          <li className={index === page ? "page-item mr-3 active" : "page-item mr-3"}>
            <Link className="page-link" to={paginationLink(index, queryParams)}>{index}</Link>
          </li>));

        return (
          <nav aria-label="Tx pagination" className="d-flex justify-content-center">
            <ul className="pagination">
              { pages[0] > 1 ? (<li className="page-item mr-3">
                            <Link className="page-link" to={paginationLink(1, queryParams)}>1</Link>
                          </li>) : null }
              { pages[0] > 2 ? (<li className='page-item mr-3'>...</li>) : null }
              { pagesList }
              { (lastPage-1 > pages[pages.length - 1]) ? (<li className='page-item mr-3'>...</li>) : null }
              { (lastPage > pages[pages.length - 1]) ? (<li className="page-item mr-3">
                            <Link className="page-link" to={paginationLink(lastPage, queryParams)}>{lastPage}</Link>
                          </li>) : null }
            </ul>
          </nav>
        );
      }
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
