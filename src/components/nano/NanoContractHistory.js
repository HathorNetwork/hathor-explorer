/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import hathorLib from '@hathor/wallet-lib';
import { reverse } from 'lodash';
import Loading from '../Loading';
import { NANO_CONTRACT_TX_HISTORY_COUNT } from '../../constants';
import TxRow from '../tx/TxRow';
import helpers from '../../utils/helpers';
import nanoApi from '../../api/nanoApi';
import WebSocketHandler from '../../WebSocketHandler';
import PaginationURL from '../../utils/pagination';
import { useIsMobile } from '../../hooks';

/**
 * Displays nano tx history in a table with pagination buttons. As the user navigates through the history,
 * the URL parameters 'hash' and 'page' are updated.
 *
 * Either all URL parameters are set or they are all missing.
 *
 * Example 1:
 *   hash = "00000000001b328fafb336b4515bb9557733fe93cf685dfd0c77cae3131f3fff"
 *   page = "previous"
 *
 * Example 2:
 *   hash = "00000000001b328fafb336b4515bb9557733fe93cf685dfd0c77cae3131f3fff"
 *   page = "next"
 */
function NanoContractHistory({ ncId }) {
  // We must use memo here because we were creating a new pagination
  // object in every new render, so the useEffect was being called forever
  const pagination = useMemo(
    () =>
      new PaginationURL({
        hash: { required: false },
        page: { required: false },
      }),
    []
  );

  const location = useLocation();
  const isMobile = useIsMobile();

  // loading {boolean} Bool to show/hide loading element
  const [loading, setLoading] = useState(true);
  // history {Array} Nano contract history
  const [history, setHistory] = useState([]);
  // errorMessage {string} Message to show when error happens on history load
  const [errorMessage, setErrorMessage] = useState('');
  // hasBefore {boolean} If 'Previous' button should be enabled
  const [hasBefore, setHasBefore] = useState(false);
  // hasAfter {boolean} If 'Next' button should be enabled
  const [hasAfter, setHasAfter] = useState(false);

  /**
   * useCallback is important here to update this method with new history state
   * otherwise it would be fixed the moment the event listener is started in the useEffect
   * with the history as an empty array
   *
   * @param {Transaction} tx Transaction object that arrived from the websocket
   */
  const updateListWs = useCallback(
    tx => {
      // We only add to the list if it's the first page and it's a new tx from this nano
      if (hasBefore) {
        return;
      }

      if (tx.version !== hathorLib.constants.NANO_CONTRACTS_VERSION || tx.nc_id !== ncId) {
        return;
      }

      let nanoHistory = [...history];
      const willHaveAfter = hasAfter || nanoHistory.length === NANO_CONTRACT_TX_HISTORY_COUNT;
      // This updates the list with the new element at first
      nanoHistory = helpers.updateListWs(nanoHistory, tx, NANO_CONTRACT_TX_HISTORY_COUNT);

      // Now update the history
      setHistory(nanoHistory);
      setHasAfter(willHaveAfter);
    },
    [history, hasAfter, hasBefore, ncId]
  );

  /**
   * useCallback is needed here because this method is used as a dependency in the useEffect
   *
   * @param {string | null} after Hash to use for pagination when user clicks to fetch the next page
   * @param {string | null} before Hash to use for pagination when user clicks to fetch the previous page
   */
  const loadData = useCallback(
    async (after, before) => {
      try {
        const data = await nanoApi.getHistory(ncId, NANO_CONTRACT_TX_HISTORY_COUNT, after, before);
        if (before) {
          // When we are querying the previous set of transactions
          // the API return the oldest first, so we need to revert the history
          reverse(data.history);
        }
        setHistory(data.history);

        if (!after && !before) {
          // This is the first load without query params, so if has_more === true
          // we must enable next button
          setHasAfter(data.has_more);
          setHasBefore(false);
          return;
        }

        if (after) {
          // We clicked the next button, so we have before page
          // and we will have the next page if has_more === true
          setHasAfter(data.has_more);
          setHasBefore(true);
          return;
        }

        if (before) {
          // We clicked the previous button, so we have next page
          // and we will have the previous page if has_more === true
          setHasAfter(true);
          setHasBefore(data.has_more);
          if (!data.has_more) {
            // We are in the first page and clicked the Previous button
            // so we must clear the query params
            pagination.clearOptionalQueryParams();
          }
          return;
        }
      } catch (e) {
        // Error in request
        setErrorMessage('Error getting nano contract history.');
      } finally {
        setLoading(false);
      }
    },
    [ncId, pagination]
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

  useEffect(() => {
    // Handle load history depending on the query params in the URL
    const queryParams = pagination.obtainQueryParams();
    let after = null;
    let before = null;
    if (queryParams.hash) {
      if (queryParams.page === 'previous') {
        before = queryParams.hash;
      } else if (queryParams.page === 'next') {
        after = queryParams.hash;
      } else {
        // Params are wrong
        pagination.clearOptionalQueryParams();
      }
    }

    loadData(after, before);
  }, [location, loadData, pagination]);

  useEffect(() => {
    // Handle new txs in the network to update the list in real time
    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [handleWebsocket]);

  if (errorMessage) {
    return <p className="text-danger mb-4">{errorMessage}</p>;
  }

  if (loading) {
    return <Loading />;
  }

  const loadNewUiTable = () => {
    return (
      <div className="table-responsive mt-5">
        <table className="new-table table-striped" id="tx-table">
          <thead>
            <tr>
              <th>Hash</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>{loadTableBody()}</tbody>
        </table>
      </div>
    );
  };

  const loadTableBody = () => {
    return history.map(tx => {
      // For some reason this API returns tx.hash instead of tx.tx_id like the others
      const rowTx = { ...tx };
      rowTx.tx_id = rowTx.hash;
      return <TxRow key={rowTx.tx_id} tx={rowTx} ellipsis={!!isMobile} />;
    });
  };

  const loadNewUiPagination = () => {
    if (history.length === 0) {
      return null;
    }

    return (
      <div className="tx-pagination-btn">
        <Link
          className={
            !hasBefore || history.length === 0 ? 'page-link-btn-disable' : 'page-link-btn-enable'
          }
          to={pagination.setURLParameters({ hash: history[0].hash, page: 'previous' })}
        >
          <button
            className={
              !hasBefore || history.length === 0
                ? 'tx-previous-btn disable-button'
                : 'tx-next-btn tx-disabled'
            }
            disabled={!hasBefore || history.length === 0}
          >
            Previous
          </button>
        </Link>
        <Link
          className={
            !hasAfter || history.length === 0 ? 'page-link-btn-disable' : 'page-link-btn-enable'
          }
          to={pagination.setURLParameters({ hash: history.slice(-1).pop().hash, page: 'next' })}
        >
          <button
            className={
              !hasAfter || history.length === 0
                ? 'tx-previous-btn disable-button'
                : 'tx-next-btn tx-enable'
            }
            disabled={!hasAfter || history.length === 0}
          >
            Next
          </button>
        </Link>
      </div>
    );
  };

  const renderNewUi = () => (
    <div className="w-100">
      {loadNewUiTable()}
      {loadNewUiPagination()}
    </div>
  );

  return renderNewUi();
}

export default NanoContractHistory;
