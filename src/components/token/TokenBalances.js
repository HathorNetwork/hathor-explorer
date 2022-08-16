/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TokenBalancesTable from './TokenBalancesTable';
import tokensApi from '../../api/tokensApi';
import { get, last, find, isEmpty } from 'lodash';
import PaginationURL from '../../utils/pagination';
import { withRouter } from "react-router-dom";
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon'
import TokenAutoCompleteField from './TokenAutoCompleteField';
import helpers from '../../utils/helpers';
import { constants as hathorLibConstants } from '@hathor/wallet-lib';


/**
 * Displays custom tokens in a table with pagination buttons and a search bar.
 */
class TokenBalances extends React.Component {
  /**
   * Structure that contains the attributes that will be part of the page URL
   */
  pagination = new PaginationURL({
    'sortBy': { required: false },
    'order': { required: false },
    'token': { required: false },
  });

  constructor(props) {
    super(props);

    // Get default states from query params and default values
    const queryParams = this.pagination.obtainQueryParams();

    const sortBy = get(queryParams, 'sortBy', 'total');
    const order = get(queryParams, 'order', 'desc');
    const tokenId = get(queryParams, 'token', hathorLibConstants.HATHOR_TOKEN_CONFIG.uid);

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
     */
    this.state = {
      tokenId,
      tokenBalances: [],
      hasAfter: false,
      hasBefore: false,
      sortBy,
      order,
      page: 1,
      pageSearchAfter: [],
      loading: true,
      isSearchLoading: false,
      calculatingPage: false,
      error: false,
      tokenBalanceInformationError: false,
      maintenanceMode: this.props.maintenanceMode,
      transactionsCount: 0,
      addressesCount: 0,
    };
  }

  componentDidMount = async () => {
    if (this.state.maintenanceMode) {
      return;
    }

    if (this.state.tokenId === hathorLibConstants.HATHOR_TOKEN_CONFIG.uid) {
      // If we had a custom token as queryParam
      // then we will perform the search after the token
      // is found in the elastic search
      // otherwise we just perform the search for HTR to show the default screen
      await this.performSearch();

      // Since we did not search for the HTR token (it is the default), we need to fetch
      // it to retrieve the transactions count
      await this.fetchHTRTransactionCount();

      this.setState({
        loading: false,
      });
    }
  }

  /**
   * Call explorer-service to get list of token balances for a given tokenId
   *
   * @param {*} searchAfter Parameter needed by ElasticSearch for pagination purposes
   * @returns tokens
   */
  getTokenBalances = async (searchAfter) => {
    const tokenBalancesRequest = await tokensApi.getBalances(this.state.tokenId, this.state.sortBy, this.state.order, searchAfter);
    this.setState({
      error: get(tokenBalancesRequest, 'error', false),
    });
    return get(tokenBalancesRequest, 'data', { hits: [], 'has_next': false });
  }

  loadTokenBalanceInformation = async () => {
    const tokenBalanceInformationRequest = await tokensApi.getBalanceInformation(this.state.tokenId);
    this.setState({
      tokenBalanceInformationError: get(tokenBalanceInformationRequest, 'error', false),
    });

    return get(tokenBalanceInformationRequest, 'data', {
      transactions: 0,
      addresses: 0,
    });
  }

  /**
   * Calls ElasticSearch (through the Explorer Service) with state data, sets loading and URL information
   */
  performSearch = async () => {
    this.setState({ isSearchLoading: true });
    const tokenBalances = await this.getTokenBalances([]);
    const tokenBalanceInformation = await this.loadTokenBalanceInformation();

    this.setState({
      isSearchLoading: false,
      loading: false,
      page: 1,
      tokenBalances: tokenBalances.hits,
      addressesCount: tokenBalanceInformation.addresses,
      hasAfter: tokenBalances.has_next,
      hasBefore: false,
      pageSearchAfter: [{
        page: 1,
        searchAfter: []
      }],
    });

    // This is ultimately called when search text, sort, or sort order changes
    this.updateURL();
  }

  /**
   * Update the URL, so user can share the results of a search
   */
  updateURL = () => {
    const newURL = this.pagination.setURLParameters({
      sortBy: this.state.sortBy,
      order: this.state.order,
      token: this.state.tokenId,
    });

    this.props.history.push(newURL);
  }

  /**
    * Process events when next page is requested by user
    */
  nextPageClicked = async () => {
    this.setState({ calculatingPage: true });

    const nextPage = this.state.page + 1;
    let searchAfter = get(find(this.state.pageSearchAfter, { page: nextPage }), 'searchAfter', []);

    // Calculate searchAfter of next page if not already calculated
    if (isEmpty(searchAfter)) {
      const lastCurrentTokenSort = get(last(this.state.tokenBalances), 'sort', []);

      const newEntry = {
        page: nextPage,
        searchAfter: lastCurrentTokenSort,
      }

      this.setState({
        pageSearchAfter: [
          ...this.state.pageSearchAfter,
          newEntry,
        ],
      });

      searchAfter = lastCurrentTokenSort;
    }

    const tokenBalances = await this.getTokenBalances(searchAfter);

    this.setState({
      tokenBalances: tokenBalances.hits,
      hasAfter: tokenBalances.has_next,
      hasBefore: true,
      page: nextPage,
      calculatingPage: false,
    });
  }

  /**
   * Process events when previous page is requested by user
   */
  previousPageClicked = async () => {
    this.setState({ calculatingPage: true });

    const previousPage = this.state.page - 1;
    const searchAfter = get(find(this.state.pageSearchAfter, { page: previousPage }), 'searchAfter', []);
    const tokenBalances = await this.getTokenBalances(searchAfter);

    this.setState({
      tokenBalances: tokenBalances.hits,
      hasAfter: true,
      hasBefore: previousPage === 1 ? false : true,
      page: previousPage,
      calculatingPage: false,
    });
  }

  fetchHTRTransactionCount = async () => {
    const tokenApiRequest = await tokensApi.getToken('00');

    this.setState({
      tokensApiError: get(tokenApiRequest, 'error', false),
      transactionsCount: get(tokenApiRequest, 'data.hits[0].transactions', 0),
    });
  }

  onTokenSelected = async (token) => {
    if (!token) {
      await helpers.setStateAsync(this, {
        tokenId: hathorLibConstants.HATHOR_TOKEN_CONFIG.uid
      });

      // HTR token is the default, so the search API is not called, we must forcefully call it 
      // so we can retrieve the transactions count information
      await this.fetchHTRTransactionCount();

      this.performSearch();
      return;
    }

    await helpers.setStateAsync(this, {
      tokenId: token.id,
    });

    this.performSearch();
  }

  /**
   * Process table header click. This indicates that user wants data to be sorted by a determined field
   *
   * @param {*} event
   * @param {*} header
   */
  tableHeaderClicked = async (_event, header) => {
    if (header === this.state.sortBy) {
      await helpers.setStateAsync(this, { order: this.state.order === 'asc' ? 'desc' : 'asc' });
    } else {
      await helpers.setStateAsync(this, { sortBy: header, order: 'asc' });
    }

    this.performSearch();
  }

  /**
   * Turn loading false.
  * Useful to be used by autocomplete component when the first search doesn't find any token
   */
  loadingFinished = () => {
    this.setState({ loading: false });
  }

  render() {
    if (this.state.maintenanceMode) {
      return <ErrorMessageWithIcon message='This feature is under maintenance. Please try again after some time' />;
    }

    const renderSearchField = () => {
      return <TokenAutoCompleteField onTokenSelected={this.onTokenSelected.bind(this)} tokenId={this.state.tokenId} loadingFinished={this.loadingFinished} />;
    };

    const renderTokensTable = () => {
      if (this.state.error) {
        return <ErrorMessageWithIcon message='Error loading token balances. Please try again.' />;
      }

      return (
        <TokenBalancesTable
          tokenId={this.state.tokenId}
          data={this.state.tokenBalances}
          hasBefore={this.state.hasBefore}
          hasAfter={this.state.hasAfter}
          onNextPageClicked={this.nextPageClicked}
          onPreviousPageClicked={this.previousPageClicked}
          loading={this.state.loading}
          sortBy={this.state.sortBy}
          order={this.state.order}
          tableHeaderClicked={this.tableHeaderClicked}
          calculatingPage={this.state.calculatingPage} />
      );
    };

    return (
      <div className="w-100">
        {renderSearchField()}

        <div className="token-balances-information-wrapper">
          {
            this.state.tokenId !== hathorLibConstants.HATHOR_TOKEN_CONFIG.uid && (
              <p>
                <a href={`/token_detail/${this.state.tokenId}`}>
                  Click here to see the token details
                </a>
              </p>
            )
          }
          {
            !this.state.tokenBalanceInformationError && (
              <>
                <p><b>Total number of addresses:</b> { helpers.renderValue(this.state.addressesCount, true) }</p>
                {!this.state.tokensApiError && (
                  <p><b>Total number of transactions:</b> { helpers.renderValue(this.state.transactionsCount, true) }</p>
                )}
              </>
            )
          }
          {
            this.state.tokenBalanceInformationError && (
              <ErrorMessageWithIcon message='Error loading token balance information. Please try again.' />
            )
          }
        </div>

        {renderTokensTable()}
      </div>
    );
  }
}

/**
 * maintenanceMode: A "circuit breaker" to remove additional load when a problem is affecting explorer-service or its downstream services
 */
TokenBalances.propTypes = {
  maintenanceMode: PropTypes.bool.isRequired
};

export default withRouter(TokenBalances)
