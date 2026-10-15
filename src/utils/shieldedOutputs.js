/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Pure helpers to detect confidential (shielded) activity in a full-node
 * transaction, used by the address screen. No @hathor/wallet-lib import on
 * purpose: keeps these unit-testable under the CRA jest config (which does
 * not transform wallet-lib's ESM).
 *
 * Shielded outputs live in a separate `shielded_outputs[]` array (not in
 * `outputs[]`); a shielded input is a regular input flagged
 * `type === 'shielded'`. The recipient `decoded.address` is public in both.
 */

/**
 * True when the transaction carries any shielded output or shielded input
 * whose decoded address matches `address`.
 *
 * @param {Object} [tx] Full-node transaction (from txCache)
 * @param {string} address Address being viewed
 * @returns {boolean}
 */
export function txHasConfidentialForAddress(tx, address) {
  if (!tx) {
    return false;
  }

  const shieldedOutputs = tx.shielded_outputs || [];
  for (const output of shieldedOutputs) {
    if (output?.decoded?.address === address) {
      return true;
    }
  }

  const inputs = tx.inputs || [];
  for (const input of inputs) {
    if (input?.type === 'shielded' && input?.decoded?.address === address) {
      return true;
    }
  }

  return false;
}

/**
 * Classify how the address-history Value column should render a row.
 *
 * @param {Object} params
 * @param {number} params.balance Public net balance for the selected token
 * @param {boolean} params.hasConfidential Whether the tx has confidential
 *   activity for this address
 * @returns {'confidential-only'|'value-and-confidential'|'value-only'}
 */
export function describeAddressValue({ balance, hasConfidential }) {
  if (!hasConfidential) {
    return 'value-only';
  }
  if (balance === 0) {
    return 'confidential-only';
  }
  return 'value-and-confidential';
}
