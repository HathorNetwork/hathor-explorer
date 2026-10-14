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
 * How `address` takes part in the transaction through shielded data:
 * `received` when a shielded output pays it, `sent` when an input spends a
 * shielded output it owned.
 *
 * @param {Object} [tx] Full-node transaction (from txCache)
 * @param {string} address Address being viewed
 * @returns {{ received: boolean, sent: boolean }}
 */
export function getConfidentialInvolvement(tx, address) {
  if (!tx) {
    return { received: false, sent: false };
  }

  const received = (tx.shielded_outputs || []).some(output => output?.decoded?.address === address);
  const sent = (tx.inputs || []).some(
    input => input?.type === 'shielded' && input?.decoded?.address === address
  );

  return { received, sent };
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
