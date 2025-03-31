/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { reverse } from 'lodash';
import Loading from '../../components/Loading';
import { useIsMobile } from '../../hooks';
import PaginationURL from '../../utils/pagination';
import { NANO_CONTRACTS_LIST_COUNT } from '../../constants';
import nanoApi from '../../api/nanoApi';
import NanoContractsTable from '../../components/nano/NanoContractsTable';

function NanoContractsList() {
  // We must use memo here because we were creating a new pagination
  // object in every new render, so the useEffect was being called forever
  const pagination = useMemo(
    () =>
      new PaginationURL({
        id: { required: false }, // nano contract id from the pagination
        page: { required: false }, // if user clicked 'Next' or 'Previous' in the pagination
        search: { required: false }, // search box text
        sort: { required: false }, // sorting order
      }),
    []
  );

  const searchRef = useRef(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // If is loading data
  const [loading, setLoading] = useState(true);
  // error {boolean} If there was an error when loading data
  const [error, setError] = useState(false);
  // data {Array} Array of blueprints
  const [data, setData] = useState(null);
  // hasBefore {boolean} If 'Previous' button should be enabled
  const [hasBefore, setHasBefore] = useState(false);
  // hasAfter {boolean} If 'Next' button should be enabled
  const [hasAfter, setHasAfter] = useState(false);
  // Sort direction
  const [sort, setSort] = useState(null);
  // If the user is searching for anything
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Call the API to get the nano contracts list
   * useCallback is needed here because this method is used as a dependency in the useEffect
   *
   * @param {string | null} after Nano contract id to use for pagination when user clicks to fetch the next page
   * @param {string | null} before Nano contract id to use for pagination when user clicks to fetch the previous page
   * @param {string | null} search Search text to filter the list
   * @param {string | null} sortOder Order of the list sorting
   */
  const loadData = useCallback(
    async (after, before, search, sortOrder) => {
      setLoading(true);
      setError(false);
      try {
        const dataResponse = await nanoApi.getNanoContractCreationList(
          NANO_CONTRACTS_LIST_COUNT,
          after,
          before,
          search,
          sortOrder
        );
        if (before) {
          // When we are querying the previous set of nano contracts
          // the API return the oldest first, so we need to revert the list
          reverse(dataResponse.nc_creation_txs);
        }
        setData(dataResponse.nc_creation_txs);

        if (!after && !before) {
          // This is the first load without query params, so if has_more === true
          // we must enable next button
          setHasAfter(dataResponse.has_more);
          setHasBefore(false);
          return;
        }

        if (after) {
          // We clicked the next button, so we have before page
          // and we will have the next page if has_more === true
          setHasAfter(dataResponse.has_more);
          setHasBefore(true);
          return;
        }

        if (before) {
          // We clicked the previous button, so we have next page
          // and we will have the previous page if has_more === true
          setHasAfter(true);
          setHasBefore(dataResponse.has_more);
          if (!dataResponse.has_more) {
            // We are in the first page and clicked the Previous button
            // so we must clear the id and page queryParams
            pagination.clearParametersWithoutRefresh(['id', 'page']);
          }
          return;
        }
      } catch (e) {
        // Error in request
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [pagination]
  );

  /**
   * Handle load history depending on the query params in the URL
   * useCallback is needed here because this method is used as a dependency in the useEffect
   */
  const handleLoadData = useCallback(async () => {
    const queryParams = pagination.obtainQueryParams();
    let after = null;
    let before = null;
    // We need to set data here because the user might change the URL directly
    if (queryParams.sort) {
      setSort(queryParams.sort);
    }

    if (queryParams.id) {
      if (queryParams.page === 'previous') {
        before = queryParams.id;
      } else if (queryParams.page === 'next') {
        after = queryParams.id;
      } else {
        // Params are wrong
        pagination.clearOptionalQueryParams();
      }
    }

    if (queryParams.search) {
      // We need to set it here because the user might add the search param directly in the URL
      searchRef.current.value = queryParams.search;
      setIsSearching(true);
    }

    loadData(after, before, queryParams.search, queryParams.sort);
  }, [loadData, pagination]);

  useEffect(() => {
    // Get data when the URL changes
    handleLoadData();
  }, [location, loadData, pagination, handleLoadData]);

  /**
   * Track search field change so we can remove the search key from the URL when the user clears the search field
   * XXX Unfortunately there's no event for the clear icon click
   */
  const handleSearchChange = () => {
    if (searchRef.current.value === '' && isSearching) {
      setIsSearching(false);
      const newURL = pagination.setURLParameters({}, ['search']);
      navigate(newURL);
      handleLoadData();
    }
  };

  /**
   * Handle any key up event to execute the search when the user clicks "Enter" key
   *
   * @param {Object} e Key up event object.
   */
  const handleKeyUp = e => {
    if (e.key === 'Enter') {
      setIsSearching(true);
      // If we are starting a new search, we must ignore the pagination parameters and go to the first page
      const paramsToDelete = ['id', 'page'];
      const newURL = pagination.setURLParameters(
        { search: searchRef.current.value },
        paramsToDelete
      );
      navigate(newURL);
      handleLoadData();
    }
  };

  /**
   * When the user clicks in the list row, we redirect to the nano contract detail screen
   *
   * @param {string} id Blueprint id
   */
  const handleClickRow = id => {
    navigate(`/nano_contract/detail/${id}`);
  };

  /**
   * Method to handle click to sort the list.
   * We clear the pagination parameters but keep the search.
   */
  const onSortClicked = () => {
    let newSort;
    if (sort === 'asc') {
      newSort = 'desc';
    } else {
      newSort = 'asc';
    }
    // When we change the sorting of the list, we must go to the first page
    const paramsToDelete = ['id', 'page'];
    const newURL = pagination.setURLParameters({ sort: newSort }, paramsToDelete);
    navigate(newURL);
  };

  /**
   * Handle next button click
   */
  const onNextPageClicked = () => {
    const newURL = pagination.setURLParameters({
      id: data.slice(-1).pop().nano_contract_id,
      page: 'next',
    });
    navigate(newURL);
  };

  /**
   * Handle previous button click
   */
  const onPreviousPageClicked = () => {
    const newURL = pagination.setURLParameters({ id: data[0].nano_contract_id, page: 'previous' });
    navigate(newURL);
  };

  const renderSearch = () => {
    return (
      <div className="d-flex flex-row align-items-center search">
        <input
          className="form-control bg-dark text-light search-input nano-list-search"
          type="search"
          placeholder={`Search for Nano Contract ID or Blueprint ID`}
          aria-label="Search"
          ref={searchRef}
          onKeyUp={handleKeyUp}
          onChange={handleSearchChange}
        />
      </div>
    );
  };

  const renderError = () => {
    return (
      <div className="error-container d-flex">
        <span role="img" aria-label="error" className="mb-3">
          😞
        </span>
        <p>Error loading.</p>
        <p>Please try again.</p>
        <button className="retry-button" onClick={handleLoadData}>
          Try loading again
        </button>
      </div>
    );
  };

  const renderNoResult = () => {
    return (
      <div className="no-results-container d-flex">
        <span aria-label="search" role="img" className="mb-3">
          🔍
        </span>
        <p>We couldn’t find any results.</p>
        <p>Try checking the filter text and searching again.</p>
      </div>
    );
  };

  const renderBody = () => {
    if (loading) {
      return <Loading />;
    }

    if (error) {
      return renderError();
    }

    if (!data) {
      // This should never happen but it protects trying
      // to render the screen with data == null
      return null;
    }

    if (data.length === 0) {
      return renderNoResult();
    }

    return (
      <NanoContractsTable
        tableClass="nano-contracts-table"
        handleClickRow={handleClickRow}
        data={data}
        sortBy="created_at"
        order={sort}
        tableHeaderClicked={onSortClicked}
        loading={false}
        hasBefore={hasBefore}
        hasAfter={hasAfter}
        onNextPageClicked={onNextPageClicked}
        onPreviousPageClicked={onPreviousPageClicked}
        isMobile={isMobile}
      />
    );
  };

  return (
    <div className="section-tables-stylized nano-list-container nano-creation-list">
      <h3 className="nano-list-title">Nano Contracts List</h3>
      <div className="filter-container d-flex flex-row justify-content-between">
        {renderSearch()}
      </div>
      {renderBody()}
    </div>
  );
}

export default NanoContractsList;
