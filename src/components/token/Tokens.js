/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { get, last, find, isEmpty } from 'lodash';
import { withRouter } from 'react-router-dom';
import TokensTable from './TokensTable';
import TokenSearchField from './TokenSearchField';
import tokensApi from '../../api/tokensApi';
import PaginationURL from '../../utils/pagination';
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';
import helpers from '../../utils/helpers';

/**
 * Displays custom tokens in a table with pagination buttons and a search bar.
 */
class Tokens extends React.Component {
  /**
   * Structure that contains the attributes that will be part of the page URL
   */
  pagination = new PaginationURL({
    searchText: { required: false },
    sortBy: { required: false },
    order: { required: false },
  });

  constructor(props) {
    super(props);

    /**
     * tokens: List of tokens currently being rendered.
     *         Each token element must have the fields: id, name, symbol, nft, transaction_timestamp, and sort.
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
     * maintenanceMode: Indicates if explorer-service or its downstream services are experiencing problems. If so, maintenance mode will be enabled on
     *                  our feature toggle service (Unleash) to remove additional load until the team fixes the problem
     */
    this.state = {
      tokens: [],
      hasAfter: false,
      hasBefore: false,
      searchText: '',
      sortBy: 'transaction_timestamp',
      order: 'desc',
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

    await helpers.setStateAsync(this, {
      searchText: get(queryParams, 'searchText', this.state.searchText),
      sortBy: get(queryParams, 'sortBy', this.state.sortBy),
      order: get(queryParams, 'order', this.state.order),
      loading: true,
    });

    await this.onSearchButtonClicked();

    this.setState({
      loading: false,
    });
  };

  /**
   *
   * Call explorer-service to get list of tokens according to the search criteria
   *
   * @param {*} searchAfter Parameter needed by ElasticSearch for pagination purposes
   * @returns tokens
   */
  getTokens = async searchAfter => {
    const tokensRequest = await tokensApi.getList(
      this.state.searchText,
      this.state.sortBy,
      this.state.order,
      searchAfter
    );

    this.setState({
      error: get(tokensRequest, 'error', false),
    });

    const tokens = get(tokensRequest, 'data', { hits: [], has_next: false });
    tokens.hits = tokens.hits.map(token => ({
      ...token,
      uid: token.id,
      nft: get(token, 'nft', false),
    }));
    return tokens;
  };

  /**
   * Process events when user clicks on search button
   */
  onSearchButtonClicked = async () => {
    this.setState({ isSearchLoading: true });
    const tokens = await this.getTokens([]);

    // When search button is clicked, results return to the first page
    this.setState({
      isSearchLoading: false,
      page: 1,
      tokens: tokens.hits,
      hasAfter: tokens.has_next,
      hasBefore: false,
      pageSearchAfter: [
        {
          page: 1,
          searchAfter: [],
        },
      ],
    });

    // This is ultimately called when search text, sort, or sort order changes
    this.updateURL();
  };

  /**
   * Updates searchText state value when input field is changed
   *
   * @param {*} event
   */
  onSearchTextChanged = event => {
    this.setState({ searchText: event.target.value });
  };

  /**
   * Checks if enter button is pressed. If so, treat as a button click on search icon
   *
   * @param {*} event
   */
  onSearchTextKeyUp = event => {
    if (event.key === 'Enter') {
      this.onSearchButtonClicked();
    }
  };

  /**
   * Update the URL, so user can share the results of a search
   */
  updateURL = () => {
    const newURL = this.pagination.setURLParameters({
      searchText: this.state.searchText,
      sortBy: this.state.sortBy,
      order: this.state.order,
    });

    this.props.history.push(newURL);
  };

  /**
   * Process events when next page is requested by user
   *
   * @param {*} event
   */
  nextPageClicked = async _event => {
    this.setState({ calculatingPage: true });

    const nextPage = this.state.page + 1;
    let searchAfter = get(find(this.state.pageSearchAfter, { page: nextPage }), 'searchAfter', []);

    // Calculate searchAfter of next page if not already calculated
    if (isEmpty(searchAfter)) {
      const lastCurrentTokenSort = get(last(this.state.tokens), 'sort', []);

      const newEntry = {
        page: nextPage,
        searchAfter: lastCurrentTokenSort,
      };

      this.setState({
        pageSearchAfter: [...this.state.pageSearchAfter, newEntry],
      });

      searchAfter = lastCurrentTokenSort;
    }

    const tokens = await this.getTokens(searchAfter);

    this.setState({
      tokens: tokens.hits,
      hasAfter: tokens.has_next,
      hasBefore: true,
      page: nextPage,
      calculatingPage: false,
    });
  };

  /**
   * Process events when previous page is requested by user
   *
   * @param {*} event
   */
  previousPageClicked = async _event => {
    this.setState({ calculatingPage: true });

    const previousPage = this.state.page - 1;
    const searchAfter = get(
      find(this.state.pageSearchAfter, { page: previousPage }),
      'searchAfter',
      []
    );
    const tokens = await this.getTokens(searchAfter);

    this.setState({
      tokens: tokens.hits,
      hasAfter: true,
      hasBefore: previousPage !== 1,
      page: previousPage,
      calculatingPage: false,
    });
  };

  /**
   * Process table header click. This indicates that user wants data to be sorted by a determined field
   *
   * @param {*} event
   * @param {*} header
   */
  tableHeaderClicked = async (event, header) => {
    if (header === this.state.sortBy) {
      await helpers.setStateAsync(this, { order: this.state.order === 'asc' ? 'desc' : 'asc' });
    } else {
      await helpers.setStateAsync(this, { sortBy: header, order: 'asc' });
    }

    await this.onSearchButtonClicked();
  };

  render() {
    const renderSearchField = () => {
      if (this.state.maintenanceMode) {
        return (
          <ErrorMessageWithIcon message="This feature is under maintenance. Please try again after some time" />
        );
      }

      return (
        <TokenSearchField
          onSearchButtonClicked={this.onSearchButtonClicked}
          onSearchTextChanged={this.onSearchTextChanged}
          searchText={this.state.searchText}
          onSearchTextKeyUp={this.onSearchTextKeyUp}
          isSearchLoading={this.state.isSearchLoading}
          loading={this.state.loading}
        />
      );
    };

    const renderTokensTable = () => {
      if (this.state.maintenanceMode) {
        return null;
      }

      if (this.state.error) {
        return <ErrorMessageWithIcon message="Error loading tokens. Please try again." />;
      }

      return (
        <TokensTable
          data={this.state.tokens}
          hasBefore={this.state.hasBefore}
          hasAfter={this.state.hasAfter}
          onNextPageClicked={this.nextPageClicked}
          onPreviousPageClicked={this.previousPageClicked}
          loading={this.state.loading}
          sortBy={this.state.sortBy}
          order={this.state.order}
          tableHeaderClicked={this.tableHeaderClicked}
          calculatingPage={this.state.calculatingPage}
          newUiEnabled={this.props.newUiEnabled}
        />
      );
    };

    return (
      <div className="w-100">
        <div className="col-12">
          <h1>{this.props.title}</h1>
        </div>
        {renderSearchField()}
        {renderTokensTable()}
      </div>
    );
  }
}

/**
 * title: Tokens Page title
 * maintenanceMode: A "circuit breaker" to remove additional load when a problem is affecting explorer-service or its downstream services
 */
Tokens.propTypes = {
  title: PropTypes.string.isRequired,
  maintenanceMode: PropTypes.bool.isRequired,
};

export default withRouter(Tokens);
