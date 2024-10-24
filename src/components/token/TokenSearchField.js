import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Loading from '../Loading';
import { useNewUiEnabled } from '../../hooks';

const TokenSearchField = ({
  onSearchButtonClicked,
  onSearchTextChanged,
  searchText,
  isSearchLoading,
  loading,
  onSearchTextKeyUp,
}) => {
  const newUiEnabled = useNewUiEnabled();
  const txSearchRef = useRef(null);

  return newUiEnabled ? (
    <div className="search-bar-container position-relative">
      <input
        className="form-control bg-dark text-light token-list-search-input tokens-input"
        type="search"
        placeholder="Search for UID, name, symbol or type"
        aria-label="Search"
        ref={txSearchRef}
        value={searchText}
        onKeyUp={onSearchTextKeyUp}
        onChange={onSearchTextChanged}
      />
      {isSearchLoading && !loading ? (
        <Loading
          width={25}
          height={25}
          delay={0}
          useLoadingWrapper={false}
          showSlowLoadMessage={false}
        />
      ) : (
        <i
          className="fa fa-search tokens-search-icon position-absolute"
          onClick={e => onSearchButtonClicked(e)}
        />
      )}
    </div>
  ) : (
    <div className="d-flex flex-row align-items-center navigation-search-token">
      <div className="d-flex flex-row align-items-center col-12">
        <input
          className="form-control me-2 search-input"
          type="search"
          value={searchText}
          onKeyUp={onSearchTextKeyUp}
          onChange={onSearchTextChanged}
          placeholder="Search UID, name, symbol, or type"
          aria-label="Search"
        />
      </div>
      {isSearchLoading && !loading ? (
        <Loading
          width={25}
          height={25}
          delay={0}
          useLoadingWrapper={false}
          showSlowLoadMessage={false}
        />
      ) : (
        <i className="fa fa-search pointer" onClick={e => onSearchButtonClicked(e)} />
      )}
    </div>
  );
};

TokenSearchField.propTypes = {
  onSearchButtonClicked: PropTypes.func.isRequired,
  onSearchTextChanged: PropTypes.func.isRequired,
  searchText: PropTypes.string.isRequired,
  isSearchLoading: PropTypes.bool,
  loading: PropTypes.bool,
  onSearchTextKeyUp: PropTypes.func,
};

export default TokenSearchField;
