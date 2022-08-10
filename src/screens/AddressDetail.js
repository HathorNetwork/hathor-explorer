/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AddressSummary from '../components/AddressSummary';
import AddressHistory from '../components/AddressHistory';
import PaginationURL from '../utils/pagination';
import hathorLib from '@hathor/wallet-lib';
import ReactLoading from 'react-loading';
import colors from '../index.scss';
import WebSocketHandler from '../WebSocketHandler';
import { TX_COUNT, TOKEN_COUNT } from '../constants';
import { isEqual } from 'lodash';
import metadataApi from '../api/metadataApi';
import addressApi from '../api/addressApi';
import txApi from '../api/txApi';


class AddressDetail extends React.Component {
  pagination = new PaginationURL({
    'token': {required: true},
    'page': {required: false},
  });

  addressSummaryRef = React.createRef();

  /*
   * address {String} searched address (from url)
   * selectedToken {String} UID of the selected token when address has many
   * balance {Object} Object with balance of the selected token on this address
   * transactions {Array} List of transactions history to show
   * queryParams {Object} Object with URL parameters data
   * loadingSummary {boolean} If is waiting response of data summary request
   * loadingHistory {boolean} If is waiting response of data history request
   * loadingTokens {boolean} If is waiting response of tokens request
   * errorMessage {String} message to be shown in case of an error
   * warningRefreshPage {boolean} If should show a warning to refresh the page to see newest data for the address
   * warnMissingTokens {number} If there are tokens that could not be fetched, this should be the total number of tokens.
   * selectedTokenMetadata {Object} Metadata of the selected token
   * metadataLoaded {boolean} When the selected token metadata was loaded
   * addressTokens {Object} Object with all tokens that have passed on this address, indexed by token UID, i.e. {"00": {"name": "Hathor", "symbol": "HTR", "token_id": "00"}, ...}
   * txCache {Object} we save each transaction fetched to avoid making too many calls to the fullnode
   * showReloadDataButton {boolean} show a button to reload the screen data
   * showReloadTokenButton {boolean} show a button to reload the token data
   */
  state = {
    address: null,
    selectedToken: '',
    balance: {},
    transactions: [],
    queryParams: null,
    loadingSummary: false,
    loadingHistory: false,
    loadingTokens: true,
    errorMessage: '',
    warningRefreshPage: false,
    warnMissingTokens: 0,
    selectedTokenMetadata: null,
    metadataLoaded: false,
    addressTokens: {},
    txCache: {},
    showReloadDataButton: false,
    showReloadTokenButton: false,
  }

  componentDidMount() {
    // Expects address on URL
    this.updateAddress(this.props.match.params.address);

    WebSocketHandler.on('network', this.handleWebsocket);
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('network', this.handleWebsocket);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.address !== this.props.match.params.address) {
      // Address on the URL changed
      this.pagination.clearOptionalQueryParams();
      this.updateAddress(this.props.match.params.address);
      return;
    }

    const queryParams = this.pagination.obtainQueryParams();

    // Do we have new URL params?
    if (!isEqual(this.state.queryParams, queryParams)) {
      if (queryParams.token !== this.state.queryParams.token && queryParams.token !== null) {
        // User selected a new token, so we must go to the first page (clear queryParams)
        this.pagination.clearOptionalQueryParams();
        // Need to get newQueryParams because the optional ones were cleared
        // Update state to set the new selected token on it
        // If we don't update this state here we might execute a duplicate request
        const newQueryParams = this.pagination.obtainQueryParams();
        this.setState({ queryParams: newQueryParams }, () => {
          this.reloadTokenData(newQueryParams.token);
        });
        return;
      }

      // update the query params state then fetch the new page
      this.setState({ queryParams, loadingHistory: true }, () => {
        // Fetch new data, unless query params were cleared and we were already in the most recent page
        this.getHistoryData(+queryParams.page);
      });
    }
  }

  /**
   * Called when 'network' ws message arrives
   * If it's a new tx message update data, in case is necessary
   *
   * @param {Object} wsData Data from websocket
   */
  handleWebsocket = (wsData) => {
    if (wsData.type === 'network:new_tx_accepted') {
      if (this.shouldUpdate(wsData, false) && !this.state.warningRefreshPage) {
        // If the search address is in one of the inputs or outputs
        this.setState({ warningRefreshPage: true });
      }
    }
  }

  /**
   * Check if address is valid and then update the state and get data from full node
   * If not valid show error message
   *
   * @param {Object} address New searched address to update state
   */
  updateAddress = (address) => {
    this.setState({ queryParams: this.pagination.obtainQueryParams() }, () => {
      if (hathorLib.transaction.isAddressValid(address)) {
        this.setState({
          address,
          loadingTokens: true,
          loadingSummary: true,
          loadingHistory: true,
          addressTokens: {},
          transactions: [],
          balance: {},
          errorMessage: '',
        }, () => {
          const queryParams = this.pagination.obtainQueryParams();
          if (queryParams.token !== null) {
            // User already have a token selected on the URL
            this.setState({ selectedToken: queryParams.token }, () => {
              this.reloadData();
            });
          } else {
            this.reloadData();
          }
        });
      } else {
        this.setState({ errorMessage: 'Invalid address.' });
      }
    });
  }

  /**
   * Update transactions data state after requesting data from the server
   *
   * @param {Object} queryParams URL parameters
   */
  getHistoryData = (page) => {
    // update query parameters
    const query = this.pagination.obtainQueryParams();
    if (query.page !== page) {
      query.page = page;
      const newURL = this.pagination.setURLParameters(query);
      this.props.history.push(newURL);
    }

    return addressApi.getHistory(this.state.address, this.state.selectedToken, TX_COUNT, TX_COUNT * page).then((response) => {
      if (!response) {
        // An error happened with the API call
        this.setState({ showReloadTokenButton: true });
        return;
      }
      const txhistory = response || [];
      this.setState({ transactions: txhistory }, () => {

        const promises = [];
        for (const tx of txhistory) {
          if (!this.state.txCache[tx.tx_id]) {
            promises.push(txApi.getTransaction(tx.tx_id));
          }
        }

        Promise.all(promises).then(results => {
          const cache = {...this.state.txCache};
          for (const result of results) {
            const tx = {...result.tx, meta: result.meta};
            cache[tx.hash] = tx;
          }
          this.setState({txCache: cache});
        });
      });
      return txhistory;
    }).finally(() => {
      this.setState({ loadingHistory: false });
    });
  }

  reloadData = () => {
    this.setState({
      loadingTokens: true,
    }, () => {
      addressApi.getTokens(this.state.address, TOKEN_COUNT).then(response => {
        if (!response) {
          // An error happened with the API call
          this.setState({ showReloadDataButton: true });
          return;
        }

        let selectedToken = '';

        if (!response) {
          throw new Error('Error fetching tokens');
        }

        const tokens = response.tokens || {};
        const total = response.total || 0;

        if (total > Object.keys(tokens).length) {
          // There were unfetched tokens
          this.setState({ warnMissingTokens: total });
        } else {
          // This will turn off the missing tokens alert
          this.setState({ warnMissingTokens: 0 });
        }

        if (this.state.selectedToken && tokens[this.state.selectedToken]) {
          // use has a selected token, we will keep the selected token
          selectedToken = this.state.selectedToken;
        } else {
          const hathorUID = hathorLib.constants.HATHOR_TOKEN_CONFIG.uid
          if (tokens[hathorUID]) {
            // If HTR is in the token list of this address, it's the default selection
            selectedToken = hathorUID;
          } else {
            // Otherwise we get the first element, if there is one
            const keys = Object.keys(tokens);
            if (keys.length === 0) {
              // In case the length is 0, we have no transactions for this address
              this.setState({ loadingTokens: false });
              return;
            }
            selectedToken = keys[0];
          }
        }

        const tokenDidChange = selectedToken !== this.state.selectedToken || this.state.selectedToken === '';

        this.setState({
          addressTokens: tokens,
          loadingTokens: false,
          selectedToken,
        }, () => {
          if (tokenDidChange || !this.state.metadataLoaded) {
            this.getSelectedTokenMetadata(selectedToken);
          }

          // Update token in the URL
          this.updateTokenURL(selectedToken);
          this.reloadTokenData(selectedToken);
        });

      }).catch(error => {
        this.setState({
          loadingTokens: false,
          errorMessage: error.toString(),
        });
      });
    });
  }

  reloadTokenData = (token) => {
    this.setState({
      loadingSummary: true,
      loadingHistory: true,
    }, () => {
      addressApi.getBalance(this.state.address, token).then(response => {
        if (!response) {
          // An error happened with the API call
          this.setState({ showReloadTokenButton: true });
          return;
        }
        const balance = response || {};
        this.setState({ balance});
        return balance;
      }).then(balance => {
        const query = this.pagination.obtainQueryParams()
        const page = (query.page && (+query.page >= this.numPages() ? 0 : +query.page)) || 0;
        return this.getHistoryData(page).then(txhistory => {
          if (!this.state.metadataLoaded) {
            this.getSelectedTokenMetadata(token);
          }
        });
      }).catch(error => {
        this.setState({ errorMessage: error });
      }).finally(() => {
        this.setState({ loadingSummary: false });
      });
    });
  }

  getSelectedTokenMetadata = (selectedToken) => {
    metadataApi.getDagMetadata(selectedToken).then((data) => {
      if (data) {
        this.setState({ selectedTokenMetadata: data });
      }
      this.setState({ metadataLoaded: true });
    });
  }

  /**
   * Callback to be executed when user changes token on select input
   *
   * @param {String} Value of the selected item
   */
  onTokenSelectChanged = (value) => {
    this.setState({
      selectedToken: value,
      metadataLoaded: false,
      selectedTokenMetadata: null,
      balance: {},
      transactions: [],
    }, () => {
      this.updateTokenURL(value);
      this.reloadTokenData(value);
    });
  }

  /**
   * Update URL with new selected token and trigger didUpdate
   *
   * @param {String} New token selected
   */
  updateTokenURL = (token) => {
    const newURL = this.pagination.setURLParameters({ token });
    this.props.history.push(newURL);
  }

  /**
   * Check if the searched address is on the inputs or outputs of the new tx
   *
   * @param {Object} tx Transaction data received in the websocket
   * @param {boolean} checkToken If should also check if token is the same, or just address
   *
   * @return {boolean} True if should update the list, false otherwise
   */
  shouldUpdate = (tx, checkToken) => {
    const arr = [...tx.outputs, ...tx.inputs];
    const token = this.pagination.obtainQueryParams().token;

    for (const element of arr) {
      if (element.decoded.address === this.state.address) {
        // Address is the same
        if ((checkToken && element.token === token) || !checkToken) {
          // Need to check token and token is the same, or no need to check token
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Redirects to transaction detail screen after clicking on a table row
   *
   * @param {String} hash Hash of tx clicked
   */
  onRowClicked = (hash) => {
    this.props.history.push(`/transaction/${hash}`);
  }

  /**
   * Refresh web page
   *
   * @param {Event} e Click event
   */
  refreshPage = (e) => {
    e.preventDefault();
    window.location.reload();
  }

  /**
   * Refresh all data for the selected token
   *
   * @param {Event} e Click event
   */
  refreshTokenData = (e) => {
    e.preventDefault();
    this.setState({ showReloadTokenButton: false }, () => {
     this.reloadTokenData();
    })
  }

  /**
   * Refresh all data.
   *
   * @param {Event} e Click event
   */
  refreshPageData = (e) => {
    e.preventDefault();
    this.setState({ showReloadDataButton: false }, () => {
     this.reloadData();
    })
  }

  numPages = () => {
    return Math.ceil(this.state.balance.transactions / TX_COUNT);
  }

  render() {
    const renderWarningAlert = () => {
      if (this.state.warningRefreshPage) {
        return (
          <div className="alert alert-warning refresh-alert" role="alert">
            There is a new transaction for this address. Please <a href="true" onClick={this.refreshPage}>refresh</a> the page to see the newest data.
          </div>
        )
      }

      return null;
    }

    const renderReloadTokenButton = () => {
      if (this.state.showReloadTokenButton) {
        return (
          <button className='btn btn-hathor m-3' onClick={this.refreshTokenData}>Reload</button>
        )
      }

      return null;
    }

    const renderReloadDataButton = () => {
      if (this.state.showReloadDataButton) {
        return (
          <button className='btn btn-hathor m-3' onClick={this.refreshPageData}>Reload</button>
        )
      }

      return null;
    }

    const renderMissingTokensAlert = () => {
      if (this.state.warnMissingTokens) {
        return (
          <div className="alert alert-warning refresh-alert" role="alert">
            This address has {this.state.warnMissingTokens} tokens but we are showing only the {TOKEN_COUNT} with the most recent activity.
          </div>
        )
      }

      return null;
    }

    const isNFT = () => {
      return this.state.selectedTokenMetadata && this.state.selectedTokenMetadata.nft;
    }

    const hasAfter = () => {
      const queryParams = this.pagination.obtainQueryParams();
      if (queryParams.page) {
        return +queryParams.page < (this.numPages()-1);
      }
      return this.numPages() > 1;
    }

    const renderData = () => {
      if (this.state.errorMessage) {
        return (
          <p className="text-danger mt-3">{this.state.errorMessage}</p>
        );
      } else if (this.state.address === null) {
        return null;
      } else if (this.state.showReloadDataButton || this.state.showReloadTokenButton) {
          return (
            <div>
              {renderReloadDataButton()}
              {renderReloadTokenButton()}
            </div>
          );
      }else {
        if (this.state.loadingSummary || this.state.loadingHistory) {
          return <ReactLoading type='spin' color={colors.purpleHathor} delay={500} />
        } else {
          return (
            <div>
              {renderWarningAlert()}
              {renderMissingTokensAlert()}
              <AddressSummary
                address={this.state.address}
                tokens={this.state.addressTokens}
                balance={this.state.balance}
                selectedToken={this.state.selectedToken}
                tokenSelectChanged={this.onTokenSelectChanged}
                isNFT={isNFT()}
                metadataLoaded={this.state.metadataLoaded}
              />
              <AddressHistory
                address={this.state.address}
                onRowClicked={this.onRowClicked}
                pagination={this.pagination}
                selectedToken={this.state.selectedToken}
                transactions={this.state.transactions}
                txCache={this.state.txCache}
                hasAfter={hasAfter()}
                isNFT={isNFT()}
                metadataLoaded={this.state.metadataLoaded}
              />
            </div>
          );
        }
      }
    }

    return (
      <div className="content-wrapper">
        {renderData()}
      </div>
    );
  }
}

export default AddressDetail;
