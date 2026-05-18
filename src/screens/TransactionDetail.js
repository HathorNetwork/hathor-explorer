/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect, useState } from 'react';
import hathorLib from '@hathor/wallet-lib';
import { useParams, useLocation } from 'react-router-dom';
import TxData from '../components/tx/TxData';
import txApi from '../api/txApi';
import metadataApi from '../api/metadataApi';
import Spinner from '../components/Spinner';
import { useIsMobile } from '../hooks';
import helpers from '../utils/helpers';
import { parseUnblindingPayload } from '../utils/unblinding';
import WebSocketHandler from '../WebSocketHandler';

/**
 * Shows the detail of a transaction or block
 *
 * @memberof Screens
 */
function TransactionDetail() {
  const { id: txUid } = useParams();
  const isMobile = useIsMobile();
  const location = useLocation();

  /**
   * unblinding {Map<onChainIndex, entry> | null}
   *   When set, TxData renders shielded outputs in cleartext (verified
   *   against the on-chain commitments — see `utils/unblinding.js`).
   *   Sourced from the URL fragment (`#unblind=…`) on first mount, or
   *   from manual paste via UnblindingPanel.
   */
  const [unblinding, setUnblinding] = useState(null);

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

  // Hydrate `unblinding` from the URL fragment on mount + whenever the
  // route id changes. Fragments are not sent to any server, so the
  // payload only ever exists on this client. A malformed fragment is
  // ignored silently — we don't want to slap an error on the page just
  // because someone landed via a stale link.
  useEffect(() => {
    const hash = location.hash || '';
    if (!hash.includes('unblind=')) {
      setUnblinding(null);
      return;
    }
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(fragment);
    const raw = params.get('unblind');
    if (!raw) {
      setUnblinding(null);
      return;
    }
    const result = parseUnblindingPayload(raw, txUid);
    setUnblinding(result.error ? null : { outputs: result.outputs, inputs: result.inputs });
  }, [location.hash, txUid]);

  // Scroll a named section into view when the URL fragment carries
  // `section=<name>`. The URL name is mapped to DOM id `<name>-section`
  // (so `section=inputs` scrolls to `id="inputs-section"`, etc.) — a
  // single suffix convention that lets new sections plug in without
  // touching this effect.
  //
  // Kept deliberately independent of the `unblind=<payload>` apply path
  // so callers can request scroll-only, apply-only, both, or neither by
  // composing the two keys — e.g. `#section=unblind&unblind=<payload>`.
  useEffect(() => {
    if (!loaded) return;
    const hash = location.hash || '';
    if (!hash) return;
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(fragment);
    const section = params.get('section');
    if (!section) return;
    const el = document.getElementById(`${section}-section`);
    if (!el) return;
    // Manual scroll instead of `scrollIntoView({ block: 'start' })` so
    // we can leave 20px of headroom — that exposes whatever sits
    // immediately above the anchor (e.g. the "Unblind transaction"
    // trigger row that precedes the Inputs/Outputs cluster).
    const targetY = window.scrollY + el.getBoundingClientRect().top - 20;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, [location.hash, loaded]);

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

  // The unblinding paste panel is rendered inside TxData itself —
  // right above the Inputs/Outputs row — so it sits next to the
  // confidential-output rows it would unblind. We just thread the
  // callbacks through; gating on `shielded_outputs.length` happens
  // there.
  const onClearUnblinding = useCallback(() => setUnblinding(null), []);

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
            unblinding={unblinding}
            onApplyUnblinding={setUnblinding}
            onClearUnblinding={onClearUnblinding}
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
