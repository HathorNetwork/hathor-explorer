import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Loading from '../Loading';

const TokenSearchField = ({
  onSearchButtonClicked,
  onSearchTextChanged,
  searchText,
  isSearchLoading,
  loading,
  onSearchTextKeyUp,
}) => {
  const txSearchRef = useRef(null);

  return (
    <div className="search-bar-container position-relative">
      <input
        className="form-control bg-dark text-light token-list-search-input tokens-input"
        type="search"
        placeholder="Search for UID, name, symbol or fee model"
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
