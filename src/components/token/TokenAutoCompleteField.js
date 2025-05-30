import React from 'react';
import PropTypes from 'prop-types';
import { debounce, get } from 'lodash';
import { constants as hathorLibConstants } from '@hathor/wallet-lib';
import { connect } from 'react-redux';
import tokensApi from '../../api/tokensApi';

const DEBOUNCE_SEARCH_TIME = 200; // ms

const mapStateToProps = state => {
  return { serverInfo: state.serverInfo };
};

class TokenAutoCompleteField extends React.Component {
  constructor() {
    super();

    this.state = {
      searchText: '',
      searchResults: [],
      selectedItem: null,
      error: null,
    };

    this.handleClick = this._handleClick.bind(this);
  }

  getNativeToken() {
    return {
      uid: hathorLibConstants.NATIVE_TOKEN_UID,
      name:
        this.props.serverInfo?.native_token?.name ??
        hathorLibConstants.DEFAULT_NATIVE_TOKEN_CONFIG.name,
      symbol:
        this.props.serverInfo?.native_token?.symbol ??
        hathorLibConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol,
    };
  }

  /**
   * Handles clicks on the document to decide if we should hide the autocomplete
   * results
   *
   * @param {*} event
   */
  _handleClick(e) {
    const { target } = e;
    if (!target) {
      return;
    }

    const whiteList = ['autocomplete-results', 'autocomplete-input', 'autocomplete-result-item'];

    const classList = [...target.classList];

    for (const item of whiteList) {
      if (classList.indexOf(item) > -1) {
        return;
      }
    }

    // If we reached this point, the target has none of
    // the whiteList classes, so we know the user clicked
    // outside and should hide the results
    this.setState({
      searchResults: [],
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick);

    if (this.props.tokenId !== hathorLibConstants.NATIVE_TOKEN_UID) {
      // A token was selected in the query params
      // so we must search for it here to add
      // in the autocomplete input and perform the search
      this.searchAndSelectToken();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }

  // On component update, check if the tokenId has changed
  // and if so, search for the new token
  componentDidUpdate(prevProps) {
    if (prevProps.tokenId !== this.props.tokenId) {
      this.searchAndSelectToken();
    }
  }

  /**
   * The first component mount will need to find the token item in the elastic search
   * and then execute the data search, in case a token was already selected in the query
   */
  searchAndSelectToken = async () => {
    const searchResults = await this.executeSearch(this.props.tokenId);

    if (searchResults.length > 0) {
      this.onItemSelected(searchResults[0]);
    } else {
      // The token uid in the query params didn't find any token
      this.props.loadingFinished();
    }
  };

  /**
   * Called when an item is called on the autocomplete result list
   *
   * @param {object} item
   */
  onItemSelected = item => {
    // If the token is the native token, we shold clear the selected item
    const isNativeToken = item.id === hathorLibConstants.NATIVE_TOKEN_UID;

    this.setState({
      searchResults: [],
      selectedItem: isNativeToken ? null : item,
    });

    this.props.onTokenSelected(item);
  };

  /**
   * Updates searchText state value when input field is changed
   *
   * @param {*} event
   */
  onSearchTextChanged = event => {
    this.setState({
      searchText: event.target.value,
    });

    this.performSearchDebounce();
  };

  /**
   * Called when the user clicks the "clear" button on a selected token
   */
  onClearSelectedItem = () => {
    this.setState({
      searchText: '',
      searchResults: [],
      selectedItem: null,
    });

    this.props.onTokenSelected(null);
  };

  /**
   * Called from onSearchTextChanged after DEBOUNCE_SEARCH_TIME ms from
   * a keypress
   */
  performSearchDebounce = debounce(async () => {
    if (!this.state.searchText) {
      this.setState({
        searchResults: [],
      });
      return;
    }

    const searchResults = await this.executeSearch(this.state.searchText);

    this.setState({
      searchResults,
    });
  }, DEBOUNCE_SEARCH_TIME);

  /**
   * Execute explorer service search to find the list of tokens that match the search text
   *
   * @params {string} searchText Text written by the user in the search input
   */
  executeSearch = async searchText => {
    const tokensRequest = await tokensApi.getList(searchText, 'transaction_timestamp', 'desc', []);
    this.setState({
      error: get(tokensRequest, 'error', false),
    });

    const tokens = get(tokensRequest, 'data', { hits: [], has_next: false });
    const searchResults = tokens.hits;

    return searchResults;
  };

  _renderNewInputForm() {
    if (this.state.selectedItem) {
      return (
        <div className="token-list-search-input input-padding ">
          <div className="autocomplete-selected-item">
            <span>
              {this.state.selectedItem.name} ({this.state.selectedItem.symbol}) -{' '}
              {this.state.selectedItem.id}
            </span>
            <i
              className="fa fa-times-circle pointer close-icon"
              onClick={() => this.onClearSelectedItem()}
            />
          </div>
          <i className="fa fa-search tokens-search-icon position-absolute" />
        </div>
      );
    }
    const nativeToken = this.getNativeToken();

    return (
      <div className="search-bar-container -relative">
        <textarea
          className="form-control bg-dark text-light token-list-search-input token-text-area"
          type="search"
          placeholder={`${nativeToken.name} (${nativeToken.symbol}) - Type to search for other tokens by UID, name or symbol`}
          aria-label="Search"
          ref={null}
          value={this.state.searchText}
          onKeyUp={this.onSearchTextKeyUp}
          onChange={this.onSearchTextChanged}
        />

        <i className="fa fa-search tokens-search-icon position-absolute" />
      </div>
    );
  }

  _renderNewAutocompleteResults() {
    return this.state.searchResults.map(result => (
      <li
        key={result.id}
        onClick={() => this.onItemSelected(result)}
        className="autocomplete-result-item"
      >
        {result.name} ({result.symbol}) - {result.id}
      </li>
    ));
  }

  renderNewUi() {
    return (
      <div className="d-flex align-items-center navigation-autocomplete-token">
        <div className="d-flex flex-row align-items-center col-12">
          {this._renderNewInputForm()}
        </div>
        <ul
          className={`autocomplete-results ${
            this.state.searchResults.length === 0 ? 'hidden' : ''
          }`}
        >
          {this._renderNewAutocompleteResults()}
        </ul>
      </div>
    );
  }

  render() {
    return this.renderNewUi();
  }
}

/**
 * onTokenSelected: Called with the token object when the user selects a token
 */
TokenAutoCompleteField.propTypes = {
  onTokenSelected: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(TokenAutoCompleteField);
