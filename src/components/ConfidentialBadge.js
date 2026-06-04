/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Shield-with-padlock glyph used to mark confidential (shielded) data.
 * Mirrors the inline icon in tx/TxData.js (#514) so the transaction and
 * address screens share the same iconography.
 */
export function ShieldIcon({ className }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.6795 10.5514H9.3205C9.49128 10.5514 9.63439 10.4936 9.74983 10.378C9.86528 10.2626 9.923 10.1195 9.923 9.94871V7.97437C9.923 7.80371 9.86528 7.6606 9.74983 7.54504C9.63439 7.4296 9.49128 7.37187 9.3205 7.37187H9.26283V6.70521C9.26283 6.35565 9.14083 6.05887 8.89683 5.81487C8.65283 5.57076 8.356 5.44871 8.00633 5.44871C7.65678 5.44871 7.36 5.57076 7.116 5.81487C6.872 6.05887 6.75 6.35565 6.75 6.70521V7.37187H6.6795C6.50872 7.37187 6.36561 7.4296 6.25017 7.54504C6.13472 7.6606 6.077 7.80371 6.077 7.97437V9.94871C6.077 10.1195 6.13472 10.2626 6.25017 10.378C6.36561 10.4936 6.50872 10.5514 6.6795 10.5514ZM7.33967 7.37187V6.70521C7.33967 6.51632 7.40356 6.35799 7.53133 6.23021C7.65911 6.10243 7.81744 6.03854 8.00633 6.03854C8.19522 6.03854 8.35356 6.10243 8.48133 6.23021C8.60911 6.35799 8.673 6.51632 8.673 6.70521V7.37187H7.33967ZM7.79617 14.2307C7.7295 14.2196 7.66494 14.2029 7.6025 14.1807C6.19661 13.6807 5.07806 12.7942 4.24683 11.5212C3.41561 10.2481 3 8.87437 3 7.40004V4.39754C3 4.14432 3.07283 3.91637 3.2185 3.71371C3.36406 3.51115 3.55233 3.36432 3.78333 3.27321L7.57817 1.85654C7.72094 1.80521 7.86156 1.77954 8 1.77954C8.13844 1.77954 8.27906 1.80521 8.42183 1.85654L12.2167 3.27321C12.4477 3.36432 12.6359 3.51115 12.7815 3.71371C12.9272 3.91637 13 4.14432 13 4.39754V7.40004C13 8.87437 12.5844 10.2481 11.7532 11.5212C10.9219 12.7942 9.80339 13.6807 8.3975 14.1807C8.33506 14.2029 8.2705 14.2196 8.20383 14.2307C8.13717 14.2418 8.06922 14.2474 8 14.2474C7.93078 14.2474 7.86283 14.2418 7.79617 14.2307ZM8 13.2667C9.15556 12.9 10.1111 12.1667 10.8667 11.0667C11.6222 9.96671 12 8.74449 12 7.40004V4.39104C12 4.34837 11.9882 4.30993 11.9647 4.27571C11.9412 4.24148 11.9081 4.21582 11.8653 4.19871L8.0705 2.78204C8.04917 2.77348 8.02567 2.76921 8 2.76921C7.97433 2.76921 7.95083 2.77348 7.9295 2.78204L4.13467 4.19871C4.09189 4.21582 4.05878 4.24148 4.03533 4.27571C4.01178 4.30993 4 4.34837 4 4.39104V7.40004C4 8.74449 4.37778 9.96671 5.13333 11.0667C5.88889 12.1667 6.84444 12.9 8 13.2667Z"
        fill="#B7BFC7"
      />
    </svg>
  );
}

ShieldIcon.propTypes = {
  className: PropTypes.string,
};

ShieldIcon.defaultProps = {
  className: 'me-1',
};

/**
 * Inline "Confidential" badge. With `tokenSymbol` (AmountShielded) it reads
 * "Confidential amount · <SYMBOL>"; otherwise just "Confidential".
 */
function ConfidentialBadge({ tokenSymbol }) {
  return (
    <span className="fw-bold d-inline-flex align-items-center">
      <ShieldIcon />
      {tokenSymbol ? (
        <>
          <span className="fst-italic">Confidential amount</span>
          <span className="mx-2">·</span>
          <span>{tokenSymbol}</span>
        </>
      ) : (
        <span className="fst-italic">Confidential</span>
      )}
    </span>
  );
}

ConfidentialBadge.propTypes = {
  tokenSymbol: PropTypes.string,
};

ConfidentialBadge.defaultProps = {
  tokenSymbol: undefined,
};

export default ConfidentialBadge;
