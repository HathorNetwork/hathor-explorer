/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { get, last, find, isEmpty } from 'lodash';
import { useHistory } from 'react-router-dom';
import { numberUtils, constants as hathorLibConstants } from '@hathor/wallet-lib';
import TokenBalancesTable from './TokenBalancesTable';
import tokensApi from '../../api/tokensApi';
import PaginationURL from '../../utils/pagination';
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';
import TokenAutoCompleteField from './TokenAutoCompleteField';

/**
 * Displays custom tokens in a table with pagination buttons and a search bar.
 */
function TokenBalances({ maintenanceMode }) {
  const history = useHistory();

  /**
   * tokenBalances: List of token balances currently being rendered.
   *         Each token balance element must have the fields: address, locked_balance, unlocked_balance, total, token_id and sort.
   *         id, name, symbol are strings; nft is boolean; transaction_timestamp is long.
   *         Sort is an array with two strings, The value is given by ElasticSearch and it is passed back when we want to change page
   * hasAfter: Indicates if a next page exists
   * hasBefore: Indicates if a previous page exists
   * sortBy: Which field to sort (uid, name, symbol)
   * order: If sorted field must be ordered asc or desc
   * page: Current page. Used to know if there is a previous page
   * pageSearchAfter: Calculates the searchAfter param that needs to be passed to explorer-service in order to get the next/previous page.
   *                  We use this array to store already-calculated values,
   *                  so we do not need to recalculate them if user is requesting an already-navigated page.
   * loading: Initial loading, when user clicks on the Tokens navigation item
   * isSearchLoading: Indicates if search results are being retrieved from explorer-service
   * calculatingPage: Indicates if next page is being retrieved from explorer-service
   * error: Indicates if an unexpected error happened when calling the explorer-service
   * tokenBalanceInformationError: Indicates if an unexpected error happened when calling the token balance information service
   * maintenanceMode: Indicates if explorer-service or its downstream services are experiencing problems. If so, maintenance mode will be enabled on
   *                  our feature toggle service (Unleash) to remove additional load until the team fixes the problem
   * transactionsCount: Number of transactions for the searched token
   * addressesCount: Number of addressed for the searched token
   * tokensApiError: Flag indicating if the request to the token api failed, to decide wether to display or not the total number of transactions
   */
  const [tokenId, setTokenId] = useState(hathorLibConstants.NATIVE_TOKEN_UID);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [hasAfter, setHasAfter] = useState(false);
  const [hasBefore, setHasBefore] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [order, setOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSearchAfter, setPageSearchAfter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [calculatingPage, setCalculatingPage] = useState(false);
  const [error, setError] = useState(false);
  const [tokenBalanceInformationError, setTokenBalanceInformationError] = useState(false);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const [tokensApiError, setTokensApiError] = useState(false);

  /**
   * Structure that contains the attributes that will be part of the page URL
   */
  const pagination = useRef(
    new PaginationURL({
      sortBy: { required: false },
      order: { required: false },
      token: { required: false },
    })
  );

  const fetchHTRTransactionCount = useCallback(async () => {
    const tokenApiResponse = await tokensApi.getToken(hathorLibConstants.NATIVE_TOKEN_UID);

    setTokensApiError(get(tokenApiResponse, 'error', false));
    setTransactionsCount(get(tokenApiResponse, 'data.hits[0].transactions_count', 0));
  }, []);

  // Initialization effect, incorporating querystring parameters
  useEffect(() => {
    // Get default states from query params and default values
    const queryParams = pagination.current.obtainQueryParams();

    const querySortBy = get(queryParams, 'sortBy', 'total');
    const queryOrder = get(queryParams, 'order', 'desc');
    const queryTokenId = get(queryParams, 'token', hathorLibConstants.NATIVE_TOKEN_UID);

    setSortBy(querySortBy);
    setOrder(queryOrder);
    setTokenId(queryTokenId);

    if (queryTokenId === hathorLibConstants.NATIVE_TOKEN_UID) {
      // If we had a custom token as queryParam
      // then we will perform the search after the token
      // is found in the elastic search
      // otherwise we just perform the search for HTR to show the default screen
      setIsSearchLoading(true);

      // Since we did not search for the HTR token (it is the default), we need to fetch
      // it to retrieve the transactions count
      fetchHTRTransactionCount().catch(e =>
        console.error('Error on initial fetchHTRTransactionCount', e)
      );
    }
  }, [fetchHTRTransactionCount]);

  /**
   * Call explorer-service to get list of token balances for a given tokenId
   *
   * @param queryTokenId
   * @param querySortBy
   * @param queryOrder
   * @param {*} searchAfter Parameter needed by ElasticSearch for pagination purposes
   * @returns tokens
   */
  const getTokenBalances = useCallback(
    async (queryTokenId, querySortBy, queryOrder, searchAfter) => {
      const tokenBalancesResponse = await tokensApi.getBalances(
        queryTokenId,
        querySortBy,
        queryOrder,
        searchAfter
      );
      setError(tokenBalancesResponse.error || false);
      return tokenBalancesResponse.data || { hits: [], has_next: false };
    },
    []
  );

  const loadTokenBalanceInformation = useCallback(async queryTokenId => {
    const tokenBalanceInformationResponse = await tokensApi.getBalanceInformation(queryTokenId);
    setTokenBalanceInformationError(tokenBalanceInformationResponse.error || false);

    return (
      tokenBalanceInformationResponse.data || {
        transactions: 0,
        addresses: 0,
      }
    );
  }, []);

  /**
   * Update the URL, so user can share the results of a search
   */
  const updateURL = useCallback(
    (newTokenId, newSortBy, newOrder) => {
      const newURL = pagination.current.setURLParameters({
        token: newTokenId,
        sortBy: newSortBy,
        order: newOrder,
      });

      history.push(newURL);
    },
    [history]
  );

  /**
   * Effect that reacts to the `isSearchLoading` flag
   * Calls ElasticSearch (through the Explorer Service) with state data, sets loading and URL information
   */
  useEffect(() => {
    const performSearch = async () => {
      const fetchedTokenBalances = await getTokenBalances(tokenId, sortBy, order, []);
      const tokenBalanceInformation = await loadTokenBalanceInformation(tokenId);

      setIsSearchLoading(false);
      setLoading(false);
      setPage(1);
      setTokenBalances(fetchedTokenBalances.hits);
      setAddressesCount(tokenBalanceInformation.addresses);
      setHasAfter(fetchedTokenBalances.has_next);
      setHasBefore(false);
      setPageSearchAfter([
        {
          page: 1,
          searchAfter: [],
        },
      ]);

      // This is ultimately called when search text, sort, or sort order changes
      updateURL(tokenId, sortBy, order);
    };

    if (!isSearchLoading) {
      // Ignore this effect it the isSearchLoading flag is inactive
      return;
    }

    performSearch().catch(e => console.error('Error on performSearch effect', e));
  }, [
    isSearchLoading,
    tokenId,
    sortBy,
    order,
    getTokenBalances,
    loadTokenBalanceInformation,
    updateURL,
  ]);

  // TODO: Maybe those clicked functions must setCalculatingPage and let the rest be handled in an effect
  /**
   * Process events when next page is requested by user
   */
  const nextPageClicked = async () => {
    setCalculatingPage(true);

    const nextPage = page + 1;
    let searchAfter = get(find(pageSearchAfter, { page: nextPage }), 'searchAfter', []);

    // Calculate searchAfter of next page if not already calculated
    if (isEmpty(searchAfter)) {
      const lastCurrentTokenSort = get(last(tokenBalances), 'sort', []);

      const newEntry = {
        page: nextPage,
        searchAfter: lastCurrentTokenSort,
      };

      setPageSearchAfter([...pageSearchAfter, newEntry]);

      searchAfter = lastCurrentTokenSort;
    }

    const fetchedTokenBalances = await getTokenBalances(tokenId, sortBy, order, searchAfter);

    setTokenBalances(fetchedTokenBalances.hits);
    setHasAfter(fetchedTokenBalances.has_next);
    setHasBefore(true);
    setPage(nextPage);
    setCalculatingPage(false);
  };

  /**
   * Process events when previous page is requested by user
   */
  const previousPageClicked = async () => {
    setCalculatingPage(true);

    const previousPage = page - 1;
    const searchAfter = get(find(pageSearchAfter, { page: previousPage }), 'searchAfter', []);
    const fetchedTokenBalances = await getTokenBalances(tokenId, sortBy, order, searchAfter);

    setTokenBalances(fetchedTokenBalances.hits);
    setHasAfter(true);
    setHasBefore(previousPage !== 1);
    setPage(previousPage);
    setCalculatingPage(false);
  };

  const onTokenSelected = async newToken => {
    const newTokenId = newToken?.id || hathorLibConstants.NATIVE_TOKEN_UID;
    setTokenId(newTokenId);

    if (!newToken) {
      // HTR token is the default, so the search API is not called, we must forcefully call it
      // so we can retrieve the transactions count information
      await fetchHTRTransactionCount(); // TODO: Confirm this behavior
    } else {
      setTransactionsCount(newToken.transactions_count);
      setTokensApiError(false);
    }

    // Trigger the performSearch effect
    setIsSearchLoading(true);
  };

  /**
   * Process table header click. This indicates that user wants data to be sorted by a determined field
   *
   * @param {*} _event
   * @param {*} header
   */
  const tableHeaderClicked = async (_event, header) => {
    if (header === sortBy) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(header);
      setOrder('asc');
    }

    // Triggers the performSearch effect
    setIsSearchLoading(true);
  };

  /**
   * Turn loading false.
   * Useful to be used by autocomplete component when the first search doesn't find any token
   */
  const loadingFinished = () => {
    setLoading(false);
  };

  // If this component is called in maintenance mode, no need to execute any other calculations
  if (maintenanceMode) {
    return (
      <ErrorMessageWithIcon message="This feature is under maintenance. Please try again after some time" />
    );
  }

  const renderSearchField = () => {
    return (
      <TokenAutoCompleteField
        onTokenSelected={onTokenSelected}
        tokenId={tokenId}
        loadingFinished={loadingFinished}
      />
    );
  };

  const renderTokensTable = () => {
    if (error) {
      return <ErrorMessageWithIcon message="Error loading token balances. Please try again." />;
    }

    return (
      <TokenBalancesTable
        tokenId={tokenId}
        data={tokenBalances}
        hasBefore={hasBefore}
        hasAfter={hasAfter}
        onNextPageClicked={nextPageClicked}
        onPreviousPageClicked={previousPageClicked}
        loading={loading}
        sortBy={sortBy}
        order={order}
        tableHeaderClicked={tableHeaderClicked}
        calculatingPage={calculatingPage}
      />
    );
  };

  return (
    <div className="w-100">
      {renderSearchField()}

      <div className="token-balances-information-wrapper">
        {tokenId !== hathorLibConstants.NATIVE_TOKEN_UID && (
          <p>
            <a href={`/token_detail/${tokenId}`}>Click here to see the token details</a>
          </p>
        )}

        {!tokenBalanceInformationError && (
          <p>
            <b>Total number of addresses:</b> {numberUtils.prettyValue(addressesCount, 0)}
          </p>
        )}

        {!tokensApiError && (
          <p>
            <b>Total number of transactions:</b> {numberUtils.prettyValue(transactionsCount, 0)}
          </p>
        )}

        {(tokensApiError || tokenBalanceInformationError) && (
          <ErrorMessageWithIcon message="Error loading the complete token balance information. Please try again." />
        )}
      </div>

      {tokenId && renderTokensTable()}
    </div>
  );
}

/**
 * maintenanceMode: A "circuit breaker" to remove additional load when a problem is affecting explorer-service or its downstream services
 */
TokenBalances.propTypes = {
  maintenanceMode: PropTypes.bool.isRequired,
};

export default TokenBalances;
