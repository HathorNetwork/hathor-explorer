/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ADDRESS_BATCH_SIZE } from '../utils/shieldedRewind';

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
 * "View with your scan key" link above Inputs/Outputs, and the dialog where
 * the user pastes the key. TxData rewinds the shielded entries with it, in
 * the browser. Also reports what the wallet's `#unblind=` link revealed.
 *
 * The dialog is not built on Bootstrap's `.modal-*` classes, which assume a
 * light surface; it uses the theme variables of the rest of the page.
 *
 * Props:
 *   - onApplyScanKey(key): uses the pasted scan key; returns why it can't be
 *     used, or null.
 *   - onHide(): hides every unblinded value, the key's and the link's.
 *   - onSearchMore(): searches the next batch of addresses.
 *   - scanKeyActive: whether a scan key is in use.
 *   - linkVerifiedCount: entries of the wallet link that match the chain.
 *   - linkError: why the wallet link's values can't be shown.
 *   - progress: `{ from, to, done }` while addresses are searched.
 *   - searchedUpTo: the addresses 0 to searchedUpTo - 1 were searched.
 *   - rewoundCount / slotCount: shielded entries rewound, out of all of them.
 *   - error: why nothing could be rewound with the scan key.
 */
function UnblindingPanel({
  onApplyScanKey,
  onHide,
  onSearchMore,
  scanKeyActive,
  linkVerifiedCount,
  linkError,
  progress,
  searchedUpTo,
  rewoundCount,
  slotCount,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [keyError, setKeyError] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  // Every way of closing the dialog discards the pasted key.
  const close = () => {
    setOpen(false);
    setDraft('');
    setKeyError(null);
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
    const failure = onApplyScanKey(draft);
    if (failure) {
      setKeyError(failure);
      return;
    }
    close();
  };

  const active = scanKeyActive || linkVerifiedCount > 0;
  const entries = count =>
    `${count} of ${slotCount} confidential ${slotCount === 1 ? 'entry' : 'entries'}`;

  const renderStatus = () => {
    const failure = error || linkError;
    if (failure) {
      return (
        <div className="unblinding-status unblinding-status--error" role="alert">
          {failure}
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
    if (!scanKeyActive) {
      return linkVerifiedCount > 0 ? (
        <div className="unblinding-status" role="status">
          {entries(linkVerifiedCount)} unblinded from your wallet&apos;s link.
        </div>
      ) : null;
    }
    return (
      <div className="unblinding-status" role="status">
        {entries(rewoundCount)} belong to your addresses 0–{searchedUpTo - 1}.
        {rewoundCount < slotCount && (
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

  return (
    <>
      <div className="unblinding-trigger-row">
        {active ? (
          <button type="button" className="unblinding-trigger-link" onClick={onHide}>
            <EyeIcon />
            <span>Hide unblinded values</span>
          </button>
        ) : (
          <button
            type="button"
            className="unblinding-trigger-link"
            ref={triggerRef}
            onClick={() => setOpen(true)}
          >
            <EyeIcon />
            <span>View with your scan key</span>
          </button>
        )}
      </div>
      {renderStatus()}

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
                View with your scan key
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
              <p className="unblinding-modal__hint">
                Paste your wallet&apos;s scan key (an xpriv). The explorer rewinds the confidential
                inputs and outputs paid to your addresses in this browser. The key is never sent to
                a server or stored, and is forgotten when you leave the page.
              </p>
              <form onSubmit={submit}>
                <textarea
                  autoFocus
                  aria-label="Scan key"
                  className="unblinding-modal__textarea"
                  rows={3}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Scan key (xpriv)"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                {keyError && <div className="unblinding-modal__error">{keyError}</div>}
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
                View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UnblindingPanel;
