import React from 'react'
import PropTypes from 'prop-types';
import Loading from '../Loading';
import tokensApi from '../../api/tokensApi';
import { debounce, get } from 'lodash';

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
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
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

    this.performSearch();
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
  performSearch = debounce(async () => {
    if (!this.state.searchText) {
      this.setState({
        searchResults: [],
      });
      return;
    }

    const tokensRequest = await tokensApi.getList(this.state.searchText, 'transaction_timestamp', 'desc', []);
    this.setState({
      error: get(tokensRequest, 'error', false),
    });

    const tokens = get(tokensRequest, 'data', { hits: [], 'has_next': false });
    const searchResults = tokens.hits;

    this.setState({
      searchResults,
    });
  }, DEBOUNCE_SEARCH_TIME)

  highlight(searchedTerm, result) {
    const buildTextElement = (index, text) => {
      if (index === -1) {
        return (
          <span>{text}</span>
        );
      }

      const start = text.substring(0, index);
      const term = text.substring(index, searchedTerm.length);
      const end = text.substring(index + searchedTerm.length, text.length)

      return (
        <>
          {start}
          <span className="highlight">{term}</span>
          {end}
        </>
      )
    };

    const lowerCaseSearchedTerm = searchedTerm.toLowerCase();
    const nameMatchIndex = result.name.toLowerCase().indexOf(lowerCaseSearchedTerm);
    const symbolMatchIndex = result.symbol.toLowerCase().indexOf(lowerCaseSearchedTerm);
    const idMatchIndex = result.id.toLowerCase().indexOf(lowerCaseSearchedTerm);

    return (
      <>
        {buildTextElement(nameMatchIndex, result.name)}&nbsp;
        ({buildTextElement(symbolMatchIndex, result.symbol)})&nbsp;-&nbsp;
        {buildTextElement(idMatchIndex, result.id)}
      </>
    );
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
        placeholder="Search UID, name or symbol"
        aria-label="Search"
        ref={ref => {this.autoCompleteInputRef = ref}} />
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
      <i className="fa fa-search pointer" onClick={(e) => this.props.onSearchButtonClicked(e)} />
    );
  }

  _renderAutocompleteResults() {
    return this.state.searchResults.map((result) => (
      <li onClick={() => this.onItemSelected(result)} className="autocomplete-result-item">
        {this.highlight(this.state.searchText, result)}
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
