/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ADDRESS_BATCH_SIZE } from '../utils/shieldedRewind';
import { parseUnblindingPayload } from '../utils/unblinding';

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * "Unblind transaction" and "View with your scan key" links above
 * Inputs/Outputs, and the dialog where the user pastes either:
 *   - the unblinding values their wallet copied for this tx (or its whole
 *     `#unblind=…` link), checked like the wallet's link;
 *   - their scan key, with which TxData rewinds the shielded entries.
 * Also reports what the unblinding values revealed. Everything happens in
 * the browser.
 *
 * The dialog is not built on Bootstrap's `.modal-*` classes, which assume a
 * light surface; it uses the theme variables of the rest of the page.
 *
 * Props:
 *   - txId: hash of the tx on screen; values for another tx are refused.
 *   - onApplyUnblinding(payload): applies pasted unblinding values.
 *   - onApplyScanKey(key): uses the pasted scan key; returns why it can't be
 *     used, or null.
 *   - onHide(): hides every unblinded value, the key's and the link's.
 *   - onSearchMore(): searches the next batch of addresses.
 *   - scanKeyActive: whether a scan key is in use.
 *   - linkVerifiedCount: unblinding values (link or pasted) that match the chain.
 *   - linkError: why the unblinding values can't be shown.
 *   - progress: `{ from, to, done }` while addresses are searched.
 *   - searchedUpTo: the addresses 0 to searchedUpTo - 1 were searched.
 *   - rewoundCount: entries the scan key opened; rewindFailedCount: entries it
 *     pointed to that failed their check.
 *   - scannableCount: entries a scan key can be tried on.
 *   - slotCount: all shielded entries of the tx.
 *   - error: why nothing could be rewound with the scan key.
 */
function UnblindingPanel({
  txId,
  onApplyUnblinding,
  onApplyScanKey,
  onHide,
  onSearchMore,
  scanKeyActive,
  linkVerifiedCount,
  linkError,
  progress,
  searchedUpTo,
  rewoundCount,
  rewindFailedCount,
  scannableCount,
  slotCount,
  error,
}) {
  // mode: what the open dialog takes, 'values' or 'scanKey'; null when closed.
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState('');
  const [inputError, setInputError] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const open = mode !== null;

  const openDialog = (nextMode, trigger) => {
    triggerRef.current = trigger;
    setMode(nextMode);
  };

  // Every way of closing the dialog discards what was pasted.
  const close = () => {
    setMode(null);
    setDraft('');
    setInputError(null);
    triggerRef.current?.focus();
  };

  // While the dialog is open: lock the page scroll, close on ESC, and keep
  // Tab inside the dialog.
  useEffect(() => {
    if (!open) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll('button:not(:disabled), textarea')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = e => {
    e.preventDefault();
    if (mode === 'values') {
      const result = parseUnblindingPayload(draft, txId);
      if (result.error) {
        setInputError(result.error);
        return;
      }
      onApplyUnblinding({ txId, outputs: result.outputs, inputs: result.inputs });
    } else {
      const failure = onApplyScanKey(draft);
      if (failure) {
        setInputError(failure);
        return;
      }
    }
    close();
  };

  const active = scanKeyActive || linkVerifiedCount > 0;
  const entries = (count, total) =>
    `${count} of ${total} confidential ${total === 1 ? 'entry' : 'entries'}`;

  // The scan key's status and the wallet link's are independent: a broken
  // link must not hide the search progress or the "Search addresses" button.
  const renderScanKeyStatus = () => {
    if (error) {
      return (
        <div className="unblinding-status unblinding-status--error" role="alert">
          {error}
        </div>
      );
    }
    if (progress) {
      return (
        <div className="unblinding-status" role="status">
          Checking your addresses {progress.from}–{progress.to - 1}… ({progress.done}/
          {progress.to - progress.from})
        </div>
      );
    }
    if (!scanKeyActive) return null;
    return (
      <div className="unblinding-status" role="status">
        {entries(rewoundCount, scannableCount)} opened with your scan key (addresses 0–
        {searchedUpTo - 1}).
        {rewindFailedCount > 0 && ` ${rewindFailedCount} could not be checked.`}
        {rewoundCount + rewindFailedCount < scannableCount && (
          <>
            {' '}
            <button type="button" className="unblinding-inline-link" onClick={onSearchMore}>
              Search addresses {searchedUpTo}–{searchedUpTo + ADDRESS_BATCH_SIZE - 1}
            </button>
          </>
        )}
      </div>
    );
  };

  const renderLinkStatus = () => {
    if (linkError) {
      return (
        <div className="unblinding-status unblinding-status--error" role="alert">
          {linkError}
        </div>
      );
    }
    if (linkVerifiedCount === 0) return null;
    return (
      <div className="unblinding-status" role="status">
        {entries(linkVerifiedCount, slotCount)} unblinded with your wallet&apos;s unblinding values.
      </div>
    );
  };

  return (
    <>
      <div className="unblinding-trigger-row">
        {active ? (
          <button type="button" className="unblinding-trigger-link" onClick={onHide}>
            <EyeIcon />
            <span>Hide unblinded values</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="unblinding-trigger-link"
              onClick={e => openDialog('values', e.currentTarget)}
            >
              <EyeIcon />
              <span>Unblind transaction</span>
            </button>
            <button
              type="button"
              className="unblinding-trigger-link"
              onClick={e => openDialog('scanKey', e.currentTarget)}
            >
              <EyeIcon />
              <span>View with your scan key</span>
            </button>
          </>
        )}
      </div>
      {renderLinkStatus()}
      {renderScanKeyStatus()}

      {open && (
        <div className="unblinding-modal-backdrop" onClick={close} role="presentation">
          <div
            ref={dialogRef}
            className="unblinding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unblinding-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="unblinding-modal__header">
              <h5 className="unblinding-modal__title" id="unblinding-modal-title">
                {mode === 'values' ? 'Apply unblinding factors' : 'View with your scan key'}
              </h5>
              <button
                type="button"
                className="unblinding-modal__close"
                aria-label="Close"
                onClick={close}
              >
                ×
              </button>
            </div>
            <div className="unblinding-modal__body">
              {mode === 'values' ? (
                <p className="unblinding-modal__hint">
                  Paste the unblinding payload your wallet copied for this transaction (the
                  base64url string, or the full <code>#unblind=…</code> URL). The payload is
                  processed locally; nothing is sent to a server.
                </p>
              ) : (
                <>
                  <p className="unblinding-modal__hint">
                    Paste your wallet&apos;s scan key (an xpriv). The explorer opens, in this
                    browser, the confidential inputs and outputs whose amounts were encrypted to it.
                    The key is never sent to a server or stored, and is forgotten when you leave the
                    page.
                  </p>
                  <p className="unblinding-modal__hint">
                    An entry that opens with your scan key is not proof that it pays you: anyone can
                    encrypt an amount to your key while sending it to another address. Check the
                    entry&apos;s address. Never paste a key that can spend funds.
                  </p>
                </>
              )}
              <form onSubmit={submit}>
                <textarea
                  autoFocus
                  aria-label={mode === 'values' ? 'Unblinding payload' : 'Scan key'}
                  className="unblinding-modal__textarea"
                  rows={mode === 'values' ? 4 : 3}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder={mode === 'values' ? 'eyJ2IjoxLCJ0eElkIjoi…' : 'Scan key (xpriv)'}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                {inputError && <div className="unblinding-modal__error">{inputError}</div>}
              </form>
            </div>
            <div className="unblinding-modal__footer">
              <button type="button" className="unblinding-modal__secondary" onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className="unblinding-modal__primary"
                disabled={!draft.trim()}
                onClick={submit}
              >
                {mode === 'values' ? 'Apply' : 'View'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UnblindingPanel;
