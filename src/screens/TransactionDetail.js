/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useState } from 'react';
import hathorLib from '@hathor/wallet-lib';
import { useParams } from 'react-router-dom';
import TxData from '../components/tx/TxData';
import txApi from '../api/txApi';
import metadataApi from '../api/metadataApi';
import Spinner from '../components/Spinner';
import { useIsMobile } from '../hooks';
import helpers from '../utils/helpers';
import WebSocketHandler from '../WebSocketHandler';

/**
 * Shows the detail of a transaction or block
 *
 * @memberof Screens
 */
function TransactionDetail() {
  const { id: txUid } = useParams();
  const isMobile = useIsMobile();

  /**
   * transaction {Object} Loaded transaction
   *  - `transaction.meta`: Will be created by `updateTxMetadata` with data from the explorer-service metadata
   */
  const [transaction, setTransaction] = useState(null);
  /* meta {Object} Metadata of loaded transaction received from the server */
  const [meta, setMeta] = useState(null);
  /* loaded {boolean} If had success loading transaction from the server */
  const [loaded, setLoaded] = useState(false);
  /* spentOutputs {Object} Spent outputs of loaded transaction received from the server */
  const [spentOutputs, setSpentOutputs] = useState(null);
  /* confirmationData {Object} Confirmation data of loaded transaction received from the server */
  const [confirmationData, setConfirmationData] = useState(null);
  /* alertPageRefreshed {boolean} If should show an info alert to indicate the page was refreshed */
  const [alertPageRefreshed, setAlertPageRefreshed] = useState(false);

  /**
   * Called when 'network' ws message arrives
   * If the message references a new block that confirms this tx,
   * show an info alert and refresh the page
   *
   * @param {Object} wsData Data from websocket
   */
  const handleWebsocket = useCallback(async wsData => {
    // Ignore events not related to this screen
    if (wsData.type !== 'network:new_tx_accepted') {
      return;
    }

    // If the new transaction isn't a block, it cannot have confirmed our tx
    if (!hathorLib.transactionUtils.isBlock(wsData)) {
      return;
    }

    const txData = await txApi.getTransaction(txUid).catch(err => console.log(err));
    if (!txData?.success) {
      // The transaction couldn't be fetched, possibly a network error. Just return and wait for the next block.
      return;
    }

    if (!txData.meta?.first_block) {
      // The block did not confirm our transaction yet, just return and wait for the next one
      return;
    }

    // Our transaction now has a first block, so we can update its data
    setAlertPageRefreshed(true);

    // Remove the listener since we only need to detect the first block once
    WebSocketHandler.removeListener('network', handleWebsocket);

    updateTxInfo(txUid, txData).catch(e => console.error(e));
  }, []);

  /**
   * Get transaction in the server
   * @param {string} id Transaction hash
   * @param {Object} [prefetchedTxData] Prefetched transaction data to avoid making a request again
   */
  const updateTxInfo = useCallback(async (id, prefetchedTxData = undefined) => {
    const txData = prefetchedTxData ?? (await txApi.getTransaction(id));

    setLoaded(true);
    if (!txData.success) {
      setTransaction(null);
      setMeta(null);
      setSpentOutputs(null);
      setConfirmationData(null);
      return;
    }

    // Update state after receiving the transaction response back from the server
    setTransaction(txData.tx);
    setMeta(txData.meta);
    setSpentOutputs(txData.spent_outputs);

    // Get accumulated weight and confirmation level of the transaction
    if (!hathorLib.transactionUtils.isBlock(txData.tx)) {
      const confirmationDataResponse = await txApi.getConfirmationData(id);
      setConfirmationData(confirmationDataResponse);
    }

    // Get transaction metadata from explorer service, adding to the transaction properties
    if (helpers.isExplorerModeFull()) {
      const metadataResponse = await metadataApi.getDagMetadata(id);
      if (metadataResponse) {
        setTransaction({ ...txData.tx, meta: metadataResponse });
      }
    }
  }, []);

  useEffect(() => {
    updateTxInfo(txUid).catch(e => console.error(e));
  }, [txUid, updateTxInfo]);

  // WebSocket listener effect - only listen if transaction has no first block
  useEffect(() => {
    // Only start listening if we have loaded the transaction and it has no first block
    if (!loaded || !transaction || hathorLib.transactionUtils.isBlock(transaction)) {
      // Don't listen for blocks themselves or if data isn't loaded yet
      return undefined;
    }

    // Check if transaction has no first block (not yet confirmed)
    if (meta && meta.first_block) {
      // Transaction already has a first block, no need to listen
      return undefined;
    }

    // Transaction has no first block yet, start listening for new blocks
    WebSocketHandler.on('network', handleWebsocket);

    // Cleanup function to remove listener
    return () => {
      WebSocketHandler.removeListener('network', handleWebsocket);
    };
  }, [loaded, transaction, meta, handleWebsocket]);

  /**
   * Render info alert if transaction got its first block
   */
  const renderInfoAlert = () => {
    if (alertPageRefreshed) {
      return (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          This transaction was confirmed by a new block.
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      );
    }

    return null;
  };

  const renderNewUiTx = () => {
    return (
      <>
        {renderInfoAlert()}
        {transaction ? (
          <TxData
            transaction={transaction}
            confirmationData={confirmationData}
            spentOutputs={spentOutputs}
            meta={meta}
            showRaw={true}
            showConflicts={true}
            isMobile={isMobile}
          />
        ) : (
          <p className="text-danger">Transaction with hash {txUid} not found</p>
        )}
      </>
    );
  };

  return (
    <div className="flex align-items-center section-tables-stylized">
      {(() => {
        if (!loaded) {
          return <Spinner />;
        }
        return renderNewUiTx();
      })()}
    </div>
  );
}

export default TransactionDetail;
