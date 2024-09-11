/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import hathorLib from '@hathor/wallet-lib';
import ReactLoading from 'react-loading';
import { find } from 'lodash';
import { useHistory, useParams } from 'react-router-dom';
import AddressSummary from './AddressSummary';
import AddressHistory from './AddressHistory';
import PaginationURL from '../utils/pagination';
import colors from '../index.scss';
import WebSocketHandler from '../WebSocketHandler';
import { TOKEN_COUNT, TX_COUNT } from '../constants';
import metadataApi from '../api/metadataApi';
import addressApi from '../api/addressApi';
import txApi from '../api/txApi';
import ErrorMessageWithIcon from './error/ErrorMessageWithIcon';

function AddressDetailExplorer() {
  const pagination = useRef(
    new PaginationURL({
      token: { required: true },
    })
  );

  const { address } = useParams();
  const history = useHistory();

  /*
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
  const [page, setPage] = useState(0);
  const [selectedToken, setSelectedToken] = useState('');
  const [balance, setBalance] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [hasAfter, setHasAfter] = useState(false);
  const [hasBefore, setHasBefore] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingPagination, setLoadingPagination] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningRefreshPage, setWarningRefreshPage] = useState(false);
  const [warnMissingTokens, setWarnMissingTokens] = useState(0);
  const [selectedTokenMetadata, setSelectedTokenMetadata] = useState(null);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [addressTokens, setAddressTokens] = useState({});
  const [txCache, setTxCache] = useState({});
  const [showReloadDataButton, setShowReloadDataButton] = useState(false);
  const [showReloadTokenButton, setShowReloadTokenButton] = useState(false);
  const [pageSearchAfter, setPageSearchAfter] = useState([
    {
      page: 0,
      searchAfter: {
        lastTx: null,
        lastTs: null,
      },
    },
  ]);

  /**
   * Called when 'network' ws message arrives
   * If it's a new tx message update data, in case is necessary
   *
   * @param {Object} wsData Data from websocket
   */
  const handleWebsocket = useCallback(
    wsData => {
      // Ignore events not related to this screen
      if (wsData.type !== 'network:new_tx_accepted') {
        return;
      }

      if (shouldUpdate(wsData, false)) {
        // If the search address is in one of the inputs or outputs
        setWarningRefreshPage(true);
      }

      /**
       * Check if the searched address is on the inputs or outputs of the new tx
       *
       * @param {Object} tx Transaction data received in the websocket
       * @param {boolean} checkToken If should also check if token is the same, or just address
       *
       * @return {boolean} True if should update the list, false otherwise
       */
      function shouldUpdate(tx, checkToken) {
        const arr = [...tx.outputs, ...tx.inputs];
        const { token: queryToken } = pagination.current.obtainQueryParams();

        for (const element of arr) {
          if (element.decoded.address === address) {
            // Address is the same
            if ((checkToken && element.token === queryToken) || !checkToken) {
              // Need to check token and token is the same, or no need to check token
              return true;
            }
          }
        }

        return false;
      }
    },
    [address]
  );

  // Initialization effect for every address change
  useEffect(() => {
    // Clear all optional params since the address on the URL has changed
    pagination.current.clearOptionalQueryParams();

    // Validate the new address before executing any queries
    const network = hathorLib.config.getNetwork();
    const addressObj = new hathorLib.Address(address, { network });
    if (!addressObj.isValid()) {
      setErrorMessage('Invalid address.');
      // No listener was registered, so no unmount function is necessary
      return undefined;
    }

    // Trigger effect that fetches all tokens for this address and loads one of them on screen
    setLoadingTokens(true);

    // Starting the Websocket
    WebSocketHandler.on('network', handleWebsocket);
    // Return a function to remove the Websocket listener
    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [handleWebsocket, address]);

  /**
   * Update transactions data state after requesting data from the server
   *
   * @param addressToFetch
   * @param tokenToFetch
   * @param [lastTx]
   * @param [lastTs]
   */
  const getHistoryData = useCallback(
    async (addressToFetch, tokenToFetch, lastTx, lastTs) => {
      const response = await addressApi.getHistory(
        addressToFetch,
        tokenToFetch,
        TX_COUNT,
        lastTx,
        lastTs
      );

      if (!response) {
        // An error happened with the API call
        setShowReloadTokenButton(true);
        return undefined;
      }

      const { has_next, history: responseHistory } = response;
      setTransactions(responseHistory);
      setHasAfter(has_next);

      // Fetching the data from each of the transactions in the received history and storing in cache
      const txPromises = [];
      for (const tx of responseHistory) {
        if (!txCache[tx.tx_id]) {
          /**
           * The explorer-service address api does not retrieve all metadata of the transactions
           * So there are some information that are not retrieved, e.g. whether the transaction only has authorities
           * We fetch the transaction with all it's metadata to make this assertions.
           */
          txPromises.push(txApi.getTransaction(tx.tx_id));
        }
      }

      Promise.all(txPromises).then(txResults => {
        const newCache = { ...txCache };
        for (const txData of txResults) {
          const tx = { ...txData.tx, meta: txData.meta };
          newCache[tx.hash] = tx;
        }
        setTxCache(newCache);
      });
      setLoadingHistory(false);

      return undefined;
    },
    [txCache]
  );

  /**
   * Fetches the token metadata, if necessary.
   * Will discard any errors and always set the metadataLoaded to true, even without any data.
   * @type {(function(*): Promise<void>)|*}
   */
  const getSelectedTokenMetadata = useCallback(
    async tokenToFetch => {
      if (tokenToFetch === hathorLib.constants.NATIVE_TOKEN_UID) {
        console.warn(`getSelectedTokenMetadata setting metadata loaded`);
        setMetadataLoaded(true);
        return;
      }

      const dagData = await metadataApi.getDagMetadata(tokenToFetch);
      if (dagData) {
        setSelectedTokenMetadata(dagData);
      }
      setMetadataLoaded(true);
    },
    [metadataLoaded]
  );

  const reloadTokenSummaryAndHistory = useCallback(
    async (addressToReload, tokenToReload) => {
      setLoadingSummary(true);
      setLoadingHistory(true);

      try {
        const balanceData = await addressApi.getBalance(addressToReload, tokenToReload);
        if (!balanceData) {
          // An error happened with the API call
          setShowReloadTokenButton(true);
          return undefined;
        }
        setBalance(balanceData);

        await getHistoryData(addressToReload, tokenToReload);
        await getSelectedTokenMetadata(tokenToReload);
      } catch (error) {
        setErrorMessage(error);
      }
      setLoadingSummary(false);
      return undefined;
    },
    [getHistoryData, getSelectedTokenMetadata]
  );

  // Reloads Tokens for the address. Then, update the balance/summary and history
  const reloadTokensForAddress = useCallback(
    async (urlAddress, urlSelectedToken) => {
      setLoadingTokens(true);

      try {
        const tokensResponse = await addressApi.getTokens(urlAddress, TOKEN_COUNT);
        if (!tokensResponse) {
          // An error happened with the API call
          setShowReloadDataButton(true);
          return undefined;
        }

        let newSelectedToken = '';

        const tokens = tokensResponse.tokens || {};
        const total = tokensResponse.total || 0;

        if (total > Object.keys(tokens).length) {
          // There were unfetched tokens
          setWarnMissingTokens(total);
        } else {
          // This will turn off the missing tokens alert
          setWarnMissingTokens(0);
        }

        if (urlSelectedToken && tokens[urlSelectedToken]) {
          // use has a selected token, we will keep the selected token
          newSelectedToken = urlSelectedToken;
        } else {
          const hathorUID = hathorLib.constants.NATIVE_TOKEN_UID;
          if (tokens[hathorUID]) {
            // If HTR is in the token list of this address, it's the default selection
            newSelectedToken = hathorUID;
          } else {
            // Otherwise we get the first element, if there is one
            const keys = Object.keys(tokens);
            if (keys.length === 0) {
              // In case the length is 0, we have no transactions for this address
              setLoadingTokens(false);
              setLoadingSummary(false);
              setLoadingHistory(false);
              return undefined;
            }
            [newSelectedToken] = keys;
          }
        }

        setAddressTokens(tokens);
        setLoadingTokens(false);
        setSelectedToken(newSelectedToken);

        // Once all the tokens for this address are loaded, load the balance and history for the current token
        await reloadTokenSummaryAndHistory(urlAddress, newSelectedToken);
      } catch (error) {
        setLoadingTokens(false);
        setErrorMessage(error.message || error.toString());
      }

      return undefined;
    },
    [reloadTokenSummaryAndHistory]
  );

  // Loads all data on screen once the initial validation is done and a loading flag is triggered
  useEffect(() => {
    // This effect only runs once it's triggered by the "loadingTokens" flag
    if (!loadingTokens) {
      return;
    }

    // Reset all relevant state variables
    setAddressTokens({});
    setTransactions([]);
    setBalance({});
    setErrorMessage('');

    // User may already have a token selected on the URL
    const refQueryParams = pagination.current.obtainQueryParams();
    const newSelectedToken = refQueryParams.token;
    if (newSelectedToken !== null) {
      setSelectedToken(newSelectedToken);
    }

    // Fetching data from servers to populate the screen
    setLoadingSummary(true);
    setLoadingHistory(true);
    setMetadataLoaded(false);
    setSelectedTokenMetadata(null);
    reloadTokensForAddress(address, newSelectedToken).catch(e =>
      console.error('Error reloading tokens for address on address change', e)
    );
  }, [loadingTokens, address, reloadTokensForAddress]);

  /**
   * Callback to be executed when user changes token on select input
   *
   * @param {String} tokenUid of the selected item
   */
  const onTokenSelectChanged = async tokenUid => {
    setSelectedToken(tokenUid);
    setMetadataLoaded(false);
    setSelectedTokenMetadata(null);
    setBalance({});
    setTransactions([]);

    updateTokenURL(tokenUid);
    await reloadTokenSummaryAndHistory(address, tokenUid);
    return undefined;
  };

  /**
   * Update URL with new selected token and trigger didUpdate
   *
   * @param {String} token New selected token uid
   */
  const updateTokenURL = token => {
    const newURL = pagination.current.setURLParameters({ token });
    history.push(newURL);
  };

  /**
   * Redirects to transaction detail screen after clicking on a table row
   *
   * @param {String} hash Hash of tx clicked
   */
  const onRowClicked = hash => {
    history.push(`/transaction/${hash}`);
  };

  /**
   * Refresh all data for the selected token
   *
   * @param {Event} e Click event
   */
  const handleRefreshTokenButton = e => {
    e.preventDefault();
    setShowReloadTokenButton(false);

    reloadTokenSummaryAndHistory(address, selectedToken).catch(err =>
      console.error('Error on handleRefreshTokenButton', err)
    );
  };

  /**
   * Refresh all data.
   *
   * @param {Event} e Click event
   */
  const handleRefreshAllPageData = e => {
    e.preventDefault();
    setShowReloadDataButton(false);
    setWarningRefreshPage(false);

    reloadTokensForAddress(address, selectedToken).catch(err =>
      console.error('Error on handleRefreshAllPageData', err)
    );
  };

  /**
   * Reset query params then refresh data.
   *
   * @param {Event} e Click event
   */
  const reloadPage = e => {
    pagination.current.clearOptionalQueryParams();
    handleRefreshAllPageData(e);
  };

  const onNextPageClicked = async () => {
    setLoadingPagination(true);

    const { timestamp, tx_id } = transactions.at(transactions.length - 1);

    const nextPage = page + 1;

    const lastTx = tx_id;
    const lastTs = timestamp;

    // Calculate the next page searchAfter, so it we can click previous and come back to it.
    const searchAfter = {
      lastTx,
      lastTs,
    };

    const newPageSearchAfter = [
      ...pageSearchAfter,
      {
        page: nextPage,
        searchAfter,
      },
    ];

    await getHistoryData(address, selectedToken, searchAfter.lastTx, searchAfter.lastTs);

    setPageSearchAfter(newPageSearchAfter);
    setHasBefore(true);
    setLoadingPagination(false);
    setPage(nextPage);
  };

  const onPreviousPageClicked = async () => {
    setLoadingPagination(true);

    const nextPage = page - 1;
    const { searchAfter } = find(pageSearchAfter, { page: nextPage });

    await getHistoryData(address, selectedToken, searchAfter.lastTx, searchAfter.lastTs);

    setHasBefore(nextPage > 0);
    setPage(nextPage);

    setLoadingPagination(false);
  };

  const renderWarningAlert = () => {
    if (warningRefreshPage) {
      return (
        <div className="alert alert-warning refresh-alert" role="alert">
          There is a new transaction for this address. Please{' '}
          <a href="true" onClick={reloadPage}>
            refresh
          </a>{' '}
          the page to see the newest data.
        </div>
      );
    }

    return null;
  };

  const renderReloadTokenButton = () => {
    if (showReloadTokenButton) {
      return (
        <button className="btn btn-hathor m-3" onClick={handleRefreshTokenButton}>
          Reload
        </button>
      );
    }

    return null;
  };

  const renderReloadDataButton = () => {
    if (showReloadDataButton) {
      return (
        <button className="btn btn-hathor m-3" onClick={handleRefreshAllPageData}>
          Reload
        </button>
      );
    }

    return null;
  };

  const renderMissingTokensAlert = () => {
    if (warnMissingTokens) {
      return (
        <div className="alert alert-warning refresh-alert" role="alert">
          This address has {warnMissingTokens} tokens but we are showing only the {TOKEN_COUNT} with
          the most recent activity.
        </div>
      );
    }

    return null;
  };

  const isNFT = () => {
    return selectedTokenMetadata?.nft;
  };

  const renderData = () => {
    if (errorMessage) {
      return (
        <div>
          <p className="text-danger mt-3">{errorMessage}</p>
          <button className="btn btn-hathor m-3" onClick={reloadPage}>
            Reload
          </button>
        </div>
      );
    }
    if (address === null) {
      return null;
    }
    if (showReloadDataButton || showReloadTokenButton) {
      return (
        <div>
          <ErrorMessageWithIcon message="The request to get address data has failed. Try to load again, please." />
          {renderReloadDataButton()}
          {renderReloadTokenButton()}
        </div>
      );
    }
    if (loadingSummary || loadingHistory || loadingTokens) {
      return <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />;
    }
    return (
      <div>
        {renderWarningAlert()}
        {renderMissingTokensAlert()}
        <AddressSummary
          address={address}
          tokens={addressTokens}
          balance={balance}
          selectedToken={selectedToken}
          tokenSelectChanged={onTokenSelectChanged}
          isNFT={isNFT()}
          metadataLoaded={metadataLoaded}
        />
        <AddressHistory
          address={address}
          onRowClicked={onRowClicked}
          pagination={pagination.current}
          selectedToken={selectedToken}
          onNextPageClicked={onNextPageClicked}
          onPreviousPageClicked={onPreviousPageClicked}
          hasAfter={hasAfter}
          hasBefore={hasBefore}
          data={transactions}
          numTransactions={balance.transactions}
          txCache={txCache}
          isNFT={isNFT()}
          metadataLoaded={metadataLoaded}
          calculatingPage={loadingPagination}
          loading={loadingHistory}
        />
      </div>
    );
  };

  return <div className="content-wrapper">{renderData()}</div>;
}

export default AddressDetailExplorer;
