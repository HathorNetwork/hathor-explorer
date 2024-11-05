/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useState } from 'react';
import ReactLoading from 'react-loading';
import { Link, useLocation } from 'react-router-dom';
import { reverse } from 'lodash';
import { TX_COUNT } from '../../constants';
import TxRow from './TxRow';
import helpers from '../../utils/helpers';
import WebSocketHandler from '../../WebSocketHandler';
import colors from '../../index.scss';
import PaginationURL from '../../utils/pagination';
import { useNewUiEnabled, useIsMobile } from '../../hooks';
import Spinner from '../Spinner';

/**
 * Displays transactions history in a table with pagination buttons. As the user navigates through the history,
 * the URL parameters 'ts', 'hash' and 'page' are updated.
 *
 * Either all URL parameters are set or they are all missing.
 *
 * Example 1:
 *   hash = "00000000001b328fafb336b4515bb9557733fe93cf685dfd0c77cae3131f3fff"
 *   ts = "1579637190"
 *   page = "previous"
 *
 * Example 2:
 *   hash = "00000000001b328fafb336b4515bb9557733fe93cf685dfd0c77cae3131f3fff"
 *   ts = "1579637190"
 *   page = "next"
 */
function Transactions({ shouldUpdateList, updateData, title, noPagination }) {
  const newUiEnabled = useNewUiEnabled();
  const isMobile = useIsMobile();

  // We can't use a simple variable here because it triggers a re-render everytime.
  // useMemo was discussed but the idea is not to have a cache, it's more like
  // a state without setter.
  const [pagination] = useState(
    () =>
      new PaginationURL({
        ts: { required: false },
        hash: { required: false },
        page: { required: false },
      }),
    []
  );

  const location = useLocation();

  // loaded {boolean} Bool to show/hide loading element
  const [loaded, setLoaded] = useState(false);
  // transactions {Array} Transaction history
  const [transactions, setTransactions] = useState([]);
  // hasBefore {boolean} If 'Previous' button should be enabled
  const [hasBefore, setHasBefore] = useState(false);
  // hasAfter {boolean} If 'Next' button should be enabled
  const [hasAfter, setHasAfter] = useState(false);
  // firstHash {string | null} First hash of the current list
  const [firstHash, setFirstHash] = useState(null);
  // firstTimestamp {number | null} First timestamp of the current list
  const [firstTimestamp, setFirstTimestamp] = useState(null);
  // lastHash {string | null} Last hash of the current list
  const [lastHash, setLastHash] = useState(null);
  // lastTimestamp {number | null} Last timestamp of the current list
  const [lastTimestamp, setLastTimestamp] = useState(null);

  /**
   * useCallback is important here to update this method with new history state
   * otherwise it would be fixed the moment the event listener is started in the useEffect
   * with the history as an empty array
   *
   * @param {Transaction} tx Transaction object that arrived from the websocket
   */
  const updateListWs = useCallback(
    tx => {
      // We only add new tx/blocks if it's the first page
      if (!hasBefore) {
        if (shouldUpdateList(tx)) {
          const newHasAfter = hasAfter || (transactions.length === TX_COUNT && !hasAfter);
          const newTransactions = helpers.updateListWs(transactions, tx, TX_COUNT);

          const newFirstHash = transactions[0].tx_id;
          const newFirstTimestamp = transactions[0].timestamp;
          const newLastHash = transactions[transactions.length - 1].tx_id;
          const newLastTimestamp = transactions[transactions.length - 1].timestamp;

          // Finally we update the state again
          setTransactions(newTransactions);
          setFirstHash(newFirstHash);
          setFirstTimestamp(newFirstTimestamp);
          setLastHash(newLastHash);
          setLastTimestamp(newLastTimestamp);
          setHasAfter(newHasAfter);
        }
      }
    },
    [transactions, hasAfter, hasBefore, shouldUpdateList]
  );

  /**
   * useCallback is needed here because this method is used as a dependency in the useEffect
   *
   * Method to handle websocket messages that arrive in the network scope
   * This method will discard any messages that are not new transactions
   *
   * wsData {Object} Data send in the websocket message
   */
  const handleWebsocket = useCallback(
    wsData => {
      if (wsData.type === 'network:new_tx_accepted') {
        updateListWs(wsData);
      }
    },
    [updateListWs]
  );

  /**
   * useCallback is needed here because this method is used as a dependency in another useCallback
   *
   * Method to handle state updates after the new data is fetched
   *
   * data {Object} Data object from POST response with array of transactions (data.transactions)
   * queryParams {Object} Query parameters of the URL
   */
  const handleDataFetched = useCallback(
    (data, queryParams) => {
      // Handle differently if is the first GET response we receive
      // page indicates if was clicked 'previous' or 'next'
      // Set first and last hash of the transactions

      if (queryParams.page === 'previous') {
        // When we are querying the previous set of transactions
        // the API return the oldest first, so we need to revert the history
        reverse(data.transactions);
      }

      let newFirstHash = null;
      let newLastHash = null;
      let newFirstTimestamp = null;
      let newLastTimestamp = null;
      if (data.transactions.length) {
        newFirstHash = data.transactions[0].tx_id;
        newLastHash = data.transactions[data.transactions.length - 1].tx_id;
        newFirstTimestamp = data.transactions[0].timestamp;
        newLastTimestamp = data.transactions[data.transactions.length - 1].timestamp;
      }

      let newHasAfter;
      let newHasBefore;
      if (queryParams.page === 'previous') {
        newHasAfter = true;
        newHasBefore = data.has_more;
        if (!newHasBefore) {
          // Went back to most recent page: clear URL params
          pagination.clearOptionalQueryParams();
        }
      } else if (queryParams.page === 'next') {
        newHasBefore = true;
        newHasAfter = data.has_more;
      } else {
        // First load without parameters
        newHasBefore = false;
        newHasAfter = data.has_more;
      }

      setTransactions(data.transactions);
      setFirstHash(newFirstHash);
      setFirstTimestamp(newFirstTimestamp);
      setLastHash(newLastHash);
      setLastTimestamp(newLastTimestamp);
      setHasAfter(newHasAfter);
      setHasBefore(newHasBefore);
      setLoaded(true);
    },
    [pagination]
  );

  /**
   * useCallback is needed here because this method is used as a dependency in the useEffect
   *
   * Method used to call the props method that will fetch new data
   * depending on the current query params
   *
   * queryParams {Object} Query parameters of the URL
   */
  const getData = useCallback(
    queryParams => {
      updateData(queryParams.ts, queryParams.hash, queryParams.page).then(
        data => {
          handleDataFetched(data, queryParams);
        },
        e => {
          // Error in request
          console.log(e);
        }
      );
    },
    [handleDataFetched, updateData]
  );

  useEffect(() => {
    // Handle load history depending on the query params in the URL
    getData(pagination.obtainQueryParams());
  }, [location, getData, pagination]);

  useEffect(() => {
    // Handle new txs in the network to update the list in real time
    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [handleWebsocket]);

  const loadPagination = () => {
    if (transactions.length === 0) {
      return null;
    }

    return (
      <nav aria-label="Tx pagination" className="d-flex justify-content-center">
        <ul className="pagination">
          <li
            className={
              !hasBefore || transactions.length === 0 ? 'page-item me-3 disabled' : 'page-item me-3'
            }
          >
            <Link
              className="page-link"
              to={pagination.setURLParameters({
                ts: firstTimestamp,
                hash: firstHash,
                page: 'previous',
              })}
            >
              Previous
            </Link>
          </li>
          <li
            className={!hasAfter || transactions.length === 0 ? 'page-item disabled' : 'page-item'}
          >
            <Link
              className="page-link"
              to={pagination.setURLParameters({
                ts: lastTimestamp,
                hash: lastHash,
                page: 'next',
              })}
            >
              Next
            </Link>
          </li>
        </ul>
      </nav>
    );
  };

  const loadTable = () => {
    return (
      <div className="table-responsive mt-5">
        <table className="table table-striped" id="tx-table">
          <thead className="new-thead">
            <tr>
              <th className="d-none d-lg-table-cell">Hash</th>
              <th className="d-none d-lg-table-cell">Timestamp</th>
              <th className="d-table-cell d-lg-none" colSpan="2">
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

  const loadTableBody = () => {
    return transactions.map(tx => {
      return <TxRow key={tx.tx_id} tx={tx} ellipsis={!!isMobile} />;
    });
  };

  const loadNewTable = () => {
    return (
      <div className="table-responsive mt-5">
        <table className="new-table table-striped">
          <thead>
            <tr>
              <th>HASH</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>{loadTableBody()}</tbody>
        </table>
      </div>
    );
  };

  const loadNewPagination = () => {
    if (transactions.length === 0) return null;

    if (noPagination) return '';

    return (
      <div className="tx-pagination-btn">
        <Link
          className={
            !hasBefore || transactions.length === 0
              ? 'page-link-btn-disable'
              : 'page-link-btn-enable'
          }
          to={pagination.setURLParameters({
            ts: firstTimestamp,
            hash: firstHash,
            page: 'previous',
          })}
        >
          <button
            className={
              !hasBefore || transactions.length === 0
                ? 'tx-previous-btn disable-button'
                : 'tx-next-btn tx-disabled'
            }
            disabled={!hasBefore || transactions.length === 0}
          >
            Previous
          </button>
        </Link>
        <Link
          className={
            !hasAfter || transactions.length === 0
              ? 'page-link-btn-disable'
              : 'page-link-btn-enable'
          }
          to={pagination.setURLParameters({
            ts: lastTimestamp,
            hash: lastHash,
            page: 'next',
          })}
        >
          <button
            className={
              !hasAfter || transactions.length === 0
                ? 'tx-previous-btn disable-button'
                : 'tx-next-btn tx-enable'
            }
            disabled={!hasAfter || transactions.length === 0}
          >
            Next
          </button>
        </Link>
      </div>
    );
  };

  const renderUi = () => {
    return (
      <div className="w-100">
        {title}
        {!loaded ? (
          <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
        ) : (
          loadTable()
        )}
        {loadPagination()}
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <div className="w-100">
        {title}
        {!loaded ? <Spinner /> : loadNewTable()}
        {loadNewPagination()}
      </div>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default Transactions;
