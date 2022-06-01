/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TokenBalancesTable from './TokenBalancesTable';
import TokenSearchField from './TokenSearchField';
import tokensApi from '../../api/tokensApi';
import { get, last, find, isEmpty } from 'lodash';
import PaginationURL from '../../utils/pagination';
import { withRouter } from "react-router-dom";
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon'
import TokenAutoCompleteField from './TokenAutoCompleteField';

/**
 * Displays custom tokens in a table with pagination buttons and a search bar.
 */
class TokenBalances extends React.Component {
  /**
   * Structure that contains the attributes that will be part of the page URL
   */
  pagination = new PaginationURL({
    'searchText': { required: false },
    'sortBy': { required: false },
    'order': { required: false },
  });

  constructor(props) {
    super(props);

    /**
     * tokenBalances: List of token balances currently being rendered.
     *         Each token balance element must have the fields: address, locked_balance, unlocked_balance, total, token_id and sort.
     *         id, name, symbol are strings; nft is boolean; transaction_timestamp is long.
     *         Sort is an array with two strings, The value is given by ElasticSearch and it is passed back when we want to change page
     * hasAfter: Indicates if a next page exists
     * hasBefore: Indicates if a previous page exists
     * searchText: Input text written by user
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
     * maintenanceMode: Indicates if explorer-service or its downstream services are experiencing problems. If so, maintenance mode is enabled as
     *                  a "circuit breaker" to remove additional load until the team fixes the problem
     */
    this.state = {
      tokenId: '00',
      tokenBalances: [],
      hasAfter: false,
      hasBefore: false,
      searchText: '',
      sortBy: 'total',
      order: "desc",
      page: 1,
      pageSearchAfter: [],
      loading: false,
      isSearchLoading: false,
      calculatingPage: false,
      error: false,
      maintenanceMode: this.props.maintenanceMode,
    };
  }

  componentDidMount = async () => {
    if (this.state.maintenanceMode) {
      return;
    }

    // 'Click' on search to make the first query
    const queryParams = this.pagination.obtainQueryParams();

    this.setState({
      sortBy: get(queryParams, 'sortBy', this.state.sortBy),
      order: get(queryParams, 'order', this.state.order),
      loading: true,
    });

    await this.onSearchButtonClicked();

    this.setState({
      loading: false,
    });
  }

  /**
   * Call explorer-service to get list of token balances for a given tokenId
   *
   * @param {*} searchAfter Parameter needed by ElasticSearch for pagination purposes
   * @returns tokens
   */
  getTokenBalances = async (searchAfter) => {
    const tokenBalancesRequest = await tokensApi.getBalances(this.state.tokenId, this.state.searchText, this.state.sortBy, this.state.order, searchAfter);
    this.setState({
      error: get(tokenBalancesRequest, 'error', false),
    });
    const tokenBalances = get(tokenBalancesRequest, 'data', { hits: [], 'has_next': false });
    console.log('Token balances:', tokenBalances);
    return tokenBalances;
  }

  /**
    * Process events when user clicks on search button
    */
  onSearchButtonClicked = async () => {
    this.setState({ isSearchLoading: true });
    const tokenBalances = await this.getTokenBalances([]);

    //When search button is clicked, results return to the first page
    this.setState({
      isSearchLoading: false,
      page: 1,
      tokenBalances: tokenBalances.hits,
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
   * Updates searchText state value when input field is changed
   *
   * @param {*} event
   */
  onSearchTextChanged = (event) => {
    this.setState({ searchText: event.target.value });
  }

  /**
   * Checks if enter button is pressed. If so, treat as a button click on search icon
   *
   * @param {*} event
   */
  onSearchTextKeyUp = (event) => {
    if (event.key === 'Enter') {
      this.onSearchButtonClicked();
    }
  }

  /**
   * Update the URL, so user can share the results of a search
   */
  updateURL = () => {
    const newURL = this.pagination.setURLParameters({
      sortBy: this.state.sortBy,
      order: this.state.order,
    });

    this.props.history.push(newURL);
  }

  /**
    * Process events when next page is requested by user
    *
    * @param {*} event
    */
  nextPageClicked = async (event) => {
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

    const tokens = await this.getTokenBalances(searchAfter);

    this.setState({
      tokens: tokens.hits,
      hasAfter: tokens.has_next,
      hasBefore: true,
      page: nextPage,
      calculatingPage: false,
    });
  }

  /**
   * Process events when previous page is requested by user
   *
   * @param {*} event
   */
  previousPageClicked = async (event) => {
    this.setState({ calculatingPage: true });

    const previousPage = this.state.page - 1;
    const searchAfter = get(find(this.state.pageSearchAfter, { page: previousPage }), 'searchAfter', []);
    const tokens = await this.getTokenBalances(searchAfter);

    this.setState({
      tokens: tokens.hits,
      hasAfter: true,
      hasBefore: previousPage === 1 ? false : true,
      page: previousPage,
      calculatingPage: false,
    });
  }

  onTokenSelected(token) {
    if (!token) {
      this.setState({
        tokenId: '00'
      }, this.onSearchButtonClicked);

      return;
    }

    this.setState({
      tokenId: token.id,
    }, this.onSearchButtonClicked);
  }

  /**
   * Process table header click. This indicates that user wants data to be sorted by a determined field
   *
   * @param {*} event
   * @param {*} header
   */
  tableHeaderClicked = async (event, header) => {
    if (header === this.state.sortBy) {
      await this.setState({ order: this.state.order === 'asc' ? 'desc' : 'asc' });
    } else {
      await this.setState({ sortBy: header, order: 'asc' });
    }

    await this.onSearchButtonClicked();
  }

  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  onTokenDetailsClick = (uid) => {
    this.props.history.push(`/token_detail/${uid}`);
  }

  render() {
    if (this.state.maintenanceMode) {
      return <ErrorMessageWithIcon message='This feature is under maintenance. Please try again after some time' />;
    }

    const renderSearchField = () => {
      return <TokenAutoCompleteField onTokenSelected={this.onTokenSelected.bind(this)}/>;
    };

    const renderTokensTable = () => {
      if (this.state.maintenanceMode) {
        return null;
      }

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
            this.state.tokenId !== '00' && (
              <p>
                <a href="" onClick={() => this.onTokenDetailsClick(this.state.tokenId)}>
                  Click here to see the token details
                </a>
              </p>
            )
          }
          <p><b>Total number of addresses:</b> 8,212</p>
          <p><b>Total number of transactions:</b> 28,812</p>
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
