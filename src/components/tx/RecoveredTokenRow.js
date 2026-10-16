/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReactComponent as Copy } from '../../assets/images/copy-icon.svg';

/**
 * Tokens panel row of a token uid recovered by unblinding.
 *
 * The uid is plain text with a copy button, never a link: opening the token
 * page would tell the backend which token a FullShielded output hides.
 *
 * @param {Object} props
 * @param {string} props.uid Recovered token uid
 * @param {React.ReactNode} [props.marker] Shown after the short uid
 * @param {function} [props.onCopy] Called by the copy button, like CopyToClipboard's
 */
function RecoveredTokenRow({ uid, marker, onCopy }) {
  return (
    <div>
      <div className="d-inline-flex align-items-center">
        <span className="me-2">{`${uid.slice(0, 8)}…`}</span>
        {marker}
      </div>
      <div className="d-flex align-items-center">
        <span className="me-2">{uid}</span>
        <CopyToClipboard text={uid} onCopy={onCopy}>
          <Copy width="18" height="18" role="button" aria-label="Copy token uid" />
        </CopyToClipboard>
      </div>
    </div>
  );
}

export default RecoveredTokenRow;
