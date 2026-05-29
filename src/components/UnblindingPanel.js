/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { parseUnblindingPayload } from '../utils/unblinding';

/**
 * Compact "Have unblinding factors? Click here" link rendered above the
 * Inputs/Outputs section, plus a modal that opens on click for pasting
 * the payload.
 *
 * The modal is intentionally NOT built on Bootstrap's `.modal-*`
 * classes. Bootstrap's defaults assume a light surface and fight the
 * explorer's themed surfaces (dark-mode body bleed-through, button
 * variants that don't honor `--bs-*-bg`, etc.). Rolling a small
 * theme-native dialog driven by the same `--secondary-color` /
 * `--border-color` / `--bold-text-color` vars used by the rest of
 * the page is simpler and renders identically across light/dark.
 *
 * Props:
 *   - txId: hash of the displayed tx; used to reject payloads keyed
 *     to a different tx so the user gets a clear error rather than
 *     silently misleading data.
 *   - onApply({outputs, inputs}): called with the parsed payload maps.
 *   - onClear(): called when the user clears the active payload.
 *   - hasActivePayload: whether an unblinding payload is currently
 *     applied (drives the inline "applied · Clear" affordance and the
 *     modal's secondary action).
 */
function UnblindingPanel({ txId, onApply, onClear, hasActivePayload }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);

  // Lock body scroll while the modal is open and listen for ESC. Both
  // are standard dialog UX — without them, the page can scroll under
  // the modal and keyboard users can't dismiss without reaching the
  // mouse.
  useEffect(() => {
    if (!open) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = e => {
    e.preventDefault();
    setError(null);
    const result = parseUnblindingPayload(draft, txId);
    if (result.error) {
      setError(result.error);
      return;
    }
    onApply({ outputs: result.outputs, inputs: result.inputs });
    setDraft('');
    setOpen(false);
  };

  const clear = () => {
    setError(null);
    setDraft('');
    onClear();
  };

  return (
    <>
      <div className="unblinding-trigger-row">
        <button type="button" className="unblinding-trigger-link" onClick={() => setOpen(true)}>
          {/* Inline SVG eye glyph — keeps the trigger self-contained
              (no asset import, no font icon) and inherits `color` from
              the link so it flips with the theme automatically. */}
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
          {/* Label varies by state:
              - No active payload: a call-to-action ("Unblind transaction")
                inviting the user to paste one.
              - Active payload: a status badge ("Unblinded by viewer")
                that communicates the current view is augmented with the
                viewer's share. Still clickable to update / clear via
                the modal, but reads as a state indicator first — same
                phrase that used to live in the per-row pills before the
                eye-glyph redesign moved status into a single top-of-tx
                indicator. */}
          <span>{hasActivePayload ? 'Unblinded by viewer' : 'Unblind transaction'}</span>
        </button>
      </div>

      {open && (
        <div
          className="unblinding-modal-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="unblinding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unblinding-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="unblinding-modal__header">
              <h5 className="unblinding-modal__title" id="unblinding-modal-title">
                Apply unblinding factors
              </h5>
              <button
                type="button"
                className="unblinding-modal__close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="unblinding-modal__body">
              <p className="unblinding-modal__hint">
                Paste the unblinding payload your wallet copied for this transaction (the base64url
                string, or the full <code>#unblind=…</code> URL). The payload is processed locally;
                nothing is sent to a server.
              </p>
              <form onSubmit={submit}>
                <textarea
                  className="unblinding-modal__textarea"
                  rows={4}
                  placeholder="eyJ2IjoxLCJ0eElkIjoi…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                {error && <div className="unblinding-modal__error">{error}</div>}
              </form>
            </div>
            <div className="unblinding-modal__footer">
              {hasActivePayload && (
                <button
                  type="button"
                  className="unblinding-modal__revert"
                  onClick={() => {
                    clear();
                    setOpen(false);
                  }}
                >
                  Revert unblind
                </button>
              )}
              <button
                type="button"
                className="unblinding-modal__secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="unblinding-modal__primary"
                disabled={!draft.trim()}
                onClick={submit}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UnblindingPanel;
