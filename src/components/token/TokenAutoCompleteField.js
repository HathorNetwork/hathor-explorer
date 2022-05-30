import React, { createRef } from 'react'
import PropTypes from 'prop-types';
import Loading from '../Loading';
import tokensApi from '../../api/tokensApi';
import { debounce, get } from 'lodash';
import { helpers } from '@hathor/wallet-lib';

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

  _handleClick(e) {
    const target = e.target;
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

    // If we reached this point, the target has none of the whiteList classes
    this.setState({
      searchResults: [],
    });
  }

  onItemSelected = (item) => {
    this.setState({
      searchResults: [],
      selectedItem: item,
    });
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

    // performSearch will only be called after 300ms without a key press
    this.performSearch();
  }

  onClearSelectedItem = () => {
    this.setState({
      searchText: '',
      searchResults: [],
      selectedItem: null,
    });
  }

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
  }, 100)

  componentDidMount() {
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }

  render() {
    return (
      <div className="d-flex align-items-center navigation-autocomplete-token">
        <div className="d-flex flex-row align-items-center col-12">
      {
        this.state.selectedItem ? (
          <div className="selectedItemWrapper mr-2 form-control">
            <div className="autocomplete-selected-item">
              <span>{this.state.selectedItem.name} ({this.state.selectedItem.symbol}) - {this.state.selectedItem.id}</span>
              <i className="fa fa-times-circle pointer close-icon" onClick={() => this.onClearSelectedItem()} />
            </div>
          </div>
        ) : (
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
          {
            (this.props.isSearchLoading && !this.props.loading) ?
              <Loading
                width={25}
                height={25}
                delay={0}
                useLoadingWrapper={false}
                showSlowLoadMessage={false} /> :
              <i className="fa fa-search pointer" onClick={(e) => this.props.onSearchButtonClicked(e)} />
          }
        </div>
        <ul className={`autocomplete-results ${this.state.searchResults.length === 0 ? 'hidden' : ''}`}>
          {this.state.searchResults.map((result) => (
            <li onClick={() => this.onItemSelected(result)} className="autocomplete-result-item">
              {result.name} ({result.symbol}) - {result.id}
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

/**
 * onSearchButtonClicked: Function called when search button is clicked
 * onSearchTextChanged: Function called when search text changes
 * searchText: Search text inputted by user
 */
TokenAutoCompleteField.propTypes = {};

export default TokenAutoCompleteField;
