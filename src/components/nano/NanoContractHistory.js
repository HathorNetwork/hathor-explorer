/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import { Link, useLocation } from 'react-router-dom';
import { NANO_CONTRACT_TX_HISTORY_COUNT } from '../../constants';
import TxRow from '../tx/TxRow';
import helpers from '../../utils/helpers';
import nanoApi from '../../api/nanoApi';
import WebSocketHandler from '../../WebSocketHandler';
import PaginationURL from '../../utils/pagination';
import hathorLib from '@hathor/wallet-lib';
import { reverse } from 'lodash';


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
  const pagination = new PaginationURL({
    'hash': {'required': false},
    'page': {'required': false}
  });

  const location = useLocation();

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

  useEffect(() => {
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

    // Handle new txs in the network to update the list in real time
    WebSocketHandler.on('network', handleWebsocket);

    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [location]);

  const loadData = async (after, before) => {
    try {
      const data = await nanoApi.getHistory(ncId, NANO_CONTRACT_TX_HISTORY_COUNT, after, before);
      if (data.history.length === 0) {
        // XXX
        // The hathor-core API does not return if it has more or not, so if the last page
        // has exactly the number of elements of the list, we need to fetch another page
        // to understand that the previous was the final one. In that case, we just
        // return without updating the state
        if (before) {
          // It means we reached the first page going back, then we clear the query params
          pagination.clearOptionalQueryParams();
          setHasBefore(false);
        }
        if (after) {
          // It means we reached the last page going forward
          setHasAfter(false);
        }
        return;
      }
      if (before) {
        // When we are querying the previous set of transactions
        // the API return the oldest first, so we need to revert the history
        reverse(data.history);
      }
      setHistory(data.history);

      if (data.history.length < NANO_CONTRACT_TX_HISTORY_COUNT) {
        // This was the last page
        if (!after && !before) {
          // This is the first load without query params, so we do nothing because
          // previous and next are already disabled
          return;
        }

        if (after) {
          setHasAfter(false);
          setHasBefore(true);
          return;
        }

        if (before) {
          setHasAfter(true);
          setHasBefore(false);
          return;
        }
      } else {
        // This is not the last page
        if (!after && !before) {
          // This is the first load without query params, so we need to
          // enable only the next button
          setHasAfter(true);
          setHasBefore(false);
          return;
        }

        // In all other cases, we must enable both buttons
        // because this is not the last page
        setHasAfter(true);
        setHasBefore(true);
      }
    } catch (e) {
      // Error in request
      setErrorMessage('Error getting nano contract history.');
    } finally {
      setLoading(false);
    }
  }

  const handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      updateListWs(wsData);
    }
  }

  const updateListWs = (tx) => {
    // We only add to the list if it's the first page and it's a new tx from this nano
    if (!hasBefore) {
      if (tx.version === hathorLib.constants.NANO_CONTRACTS_VERSION && tx.nc_id === ncId) {
        let nanoHistory = [...history];
        const willHaveAfter = (hasAfter || nanoHistory.length === NANO_CONTRACT_TX_HISTORY_COUNT)
        // This updates the list with the new element at first
        nanoHistory = helpers.updateListWs(nanoHistory, tx, NANO_CONTRACT_TX_HISTORY_COUNT);

        // Now update the history
        setHistory(nanoHistory);
        setHasAfter(willHaveAfter);
      }
    }
  }

  if (errorMessage) {
    return <p className='text-danger mb-4'>{errorMessage}</p>;
  }

  if (loading) {
    return <Loading />;
  }

  const loadTable = () => {
    return (
      <div className="table-responsive mt-5">
        <table className="table table-striped" id="tx-table">
          <thead>
            <tr>
              <th className="d-none d-lg-table-cell">Hash</th>
              <th className="d-none d-lg-table-cell">Timestamp</th>
              <th className="d-table-cell d-lg-none" colSpan="2">Hash<br/>Timestamp</th>
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
    return history.map((tx, idx) => {
      // For some reason this API returns tx.hash instead of tx.tx_id like the others
      tx.tx_id = tx.hash;
      return (
        <TxRow key={tx.tx_id} tx={tx} />
      );
    });
  }

  const loadPagination = () => {
    if (history.length === 0) {
      return null;
    } else {
      return (
        <nav aria-label="nano history tx pagination" className="d-flex justify-content-center">
          <ul className="pagination">
            <li className={(!hasBefore || history.length === 0) ? "page-item mr-3 disabled" : "page-item mr-3"}>
              <Link className="page-link" to={pagination.setURLParameters({hash: history[0].hash, page: 'previous'})}>Previous</Link>
            </li>
            <li className={(!hasAfter || history.length === 0) ? "page-item disabled" : "page-item"}>
              <Link className="page-link" to={pagination.setURLParameters({hash: history.slice(-1).pop().hash, page: 'next'})}>Next</Link>
            </li>
          </ul>
        </nav>
      );
    }
  }

  return (
    <div className="w-100">
      {loadTable()}
      {loadPagination()}
    </div>
  );
}

export default NanoContractHistory;
