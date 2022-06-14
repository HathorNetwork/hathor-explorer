import React from 'react'
import PropTypes from 'prop-types';
import Loading from '../Loading';
import tokensApi from '../../api/tokensApi';
import { debounce, get } from 'lodash';
import { constants as hathorLibConstants } from '@hathor/wallet-lib';

const DEBOUNCE_SEARCH_TIME = 200; // ms

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

  /**
   * Handles clicks on the document to decide if we should hide the autocomplete
   * results
   *
   * @param {*} event
   */
  _handleClick(e) {
    const target = e.target;
    if (!target) {
      return;
    }

    const whiteList = [
      'autocomplete-results',
      'autocomplete-input',
      'autocomplete-result-item',
    ];

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

    if (this.props.tokenId !== hathorLibConstants.HATHOR_TOKEN_CONFIG.uid) {
      // A token was selected in the query params
      // so we must search for it here to add
      // in the autocomplete input and perform the search
      this.searchAndSelectToken();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
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
  }

  /**
   * Called when an item is called on the autocomplete result list
   *
   * @param {object} item
   */
  onItemSelected = (item) => {
    this.setState({
      searchResults: [],
      selectedItem: item,
    });

    this.props.onTokenSelected(item);
  }

  /**
   * Updates searchText state value when input field is changed
   *
   * @param {*} event
   */
  onSearchTextChanged = (event) => {
    this.setState({
      searchText: event.target.value,
    });

    this.performSearchDebounce();
  }

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
  }

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

  }, DEBOUNCE_SEARCH_TIME)

  /**
   * Execute explorer service search to find the list of tokens that match the search text
   *
   * @params {string} searchText Text written by the user in the search input
   */
  executeSearch = async (searchText) => {
    const tokensRequest = await tokensApi.getList(searchText, 'transaction_timestamp', 'desc', []);
    this.setState({
      error: get(tokensRequest, 'error', false),
    });

    const tokens = get(tokensRequest, 'data', { hits: [], 'has_next': false });
    const searchResults = tokens.hits;

    return searchResults;
  }


  _renderInputForm() {
    if (this.state.selectedItem) {
      return (
        <div className="selectedItemWrapper mr-2 form-control">
          <div className="autocomplete-selected-item">
            <span>{this.state.selectedItem.name} ({this.state.selectedItem.symbol}) - {this.state.selectedItem.id}</span>
            <i className="fa fa-times-circle pointer close-icon" onClick={() => this.onClearSelectedItem()} />
          </div>
        </div>
      );
    }

    return (
      <input
        className="form-control mr-2 autocomplete-input"
        type="search"
        value={this.state.searchText}
        onKeyUp={this.onSearchTextKeyUp}
        onChange={this.onSearchTextChanged}
        placeholder="Hathor (HTR) - Type to search for other tokens by UID, name or symbol"
        aria-label="Search" />
    )
  }

  _renderSearchIcon() {
    if (this.props.isSearchLoading && !this.props.loading) {
      return (
        <Loading
          width={25}
          height={25}
          delay={0}
          useLoadingWrapper={false}
          showSlowLoadMessage={false} />
      );
    }

    return (
      <i className="fa fa-search pointer" onClick={() => this.performSearchDebounce()} />
    );
  }

  _renderAutocompleteResults() {
    return this.state.searchResults.map((result) => (
      <li onClick={() => this.onItemSelected(result)} className="autocomplete-result-item">
        {result.name} ({result.symbol}) - {result.id}
      </li>
    ));
  }

  render() {
    return (
      <div className="d-flex align-items-center navigation-autocomplete-token">
        <div className="d-flex flex-row align-items-center col-12">
          { this._renderInputForm() }
          { this._renderSearchIcon() }
        </div>
        <ul className={`autocomplete-results ${this.state.searchResults.length === 0 ? 'hidden' : ''}`}>
          { this._renderAutocompleteResults() }
        </ul>
      </div>
    )
  }
}

/**
 * onTokenSelected: Called with the token object when the user selects a token
 */
TokenAutoCompleteField.propTypes = {
  onTokenSelected: PropTypes.func.isRequired,
};

export default TokenAutoCompleteField;
