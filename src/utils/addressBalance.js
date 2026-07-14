/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Compute the net balance a transaction produced for a given token and address,
 * with full integer precision (BigInt).
 *
 * Amount values may arrive as Number (safe range) or BigInt (large, from
 * JSONBigInt parsing), so each is normalized to BigInt before accumulating to
 * avoid precision loss and "cannot mix BigInt and other types" errors.
 *
 * @param {Object} tx Transaction data with `inputs` and `outputs`
 * @param {string} token Selected token uid
 * @param {string} address Address to compute the balance for
 * @param {function} isAuthorityOutput Predicate telling whether an input/output is an authority
 * @return {bigint} Net balance (negative when more was spent than received)
 */
export function calculateAddressBalance(tx, token, address, isAuthorityOutput) {
  let value = 0n;

  for (const txin of tx.inputs) {
    if (txin.token === token && txin.decoded.address === address && !isAuthorityOutput(txin)) {
      value -= BigInt(txin.value);
    }
  }

  for (const txout of tx.outputs) {
    if (txout.token === token && txout.decoded.address === address && !isAuthorityOutput(txout)) {
      value += BigInt(txout.value);
    }
  }

  return value;
}

export default calculateAddressBalance;
