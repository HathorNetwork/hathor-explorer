/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AMOUNT_SHIELDED_MODE } from './shieldedRewind';

/**
 * Pure helpers to describe an address-history row from the full-node
 * transaction, used by the address screen. No @hathor/wallet-lib import on
 * purpose: keeps these unit-testable under the CRA jest config (which does
 * not transform wallet-lib's ESM).
 *
 * Shielded outputs live in a separate `shielded_outputs[]` array (not in
 * `outputs[]`); a shielded input is a regular input flagged
 * `type === 'shielded'`. The recipient `decoded.address` is public in both.
 * Only what is on-chain is used: who takes part, and the token of an
 * AmountShielded entry. Amounts are never read.
 */

const TOKEN_INDEX_MASK = 0b01111111;
const TOKEN_AUTHORITY_MASK = 0b10000000;

const isShieldedInput = input => input?.type === 'shielded';

/**
 * Token of a transparent entry from the token list its `token_data` indexes.
 *
 * @param {Object} entry Output or input
 * @param {Array<Object|string>} [tokens] Token list of the tx `token_data` refers to
 * @param {string} nativeTokenUid UID of the native token
 * @returns {string|undefined} The token uid, undefined when the token list isn't known
 */
function entryToken(entry, tokens, nativeTokenUid) {
  const index = (entry?.token_data ?? 0) & TOKEN_INDEX_MASK;
  if (index === 0) {
    return nativeTokenUid;
  }
  const token = tokens?.[index - 1];
  if (!token) {
    return undefined;
  }
  return token.uid ?? token;
}

/**
 * Token of a shielded entry. Only an AmountShielded entry shows it; any other
 * mode (FullShielded) hides it.
 *
 * @param {Object} entry Shielded output or input
 * @param {Array<Object|string>} [tokens] Token list of the tx `token_data` refers to
 * @param {string} nativeTokenUid UID of the native token
 * @returns {string|null|undefined} The token uid, null when the chain hides it,
 *   undefined when the token list isn't known
 */
function shieldedEntryToken(entry, tokens, nativeTokenUid) {
  if (entry?.mode !== AMOUNT_SHIELDED_MODE) {
    return null;
  }
  return entryToken(entry, tokens, nativeTokenUid);
}

/**
 * How `address` takes part in the transaction through shielded data, for one
 * token: `received` when a shielded output pays it, `sent` when an input spends
 * a shielded output it owned. A FullShielded entry hides its token, so it counts
 * for every token; an AmountShielded entry only counts for its own token.
 *
 * An AmountShielded input's `token_data` indexes the token list of the parent
 * tx (the node sends the spent output), so the parent is looked up with
 * `getTx`. While the parent isn't known the entry counts, like a hidden token.
 *
 * @param {Object} [tx] Full-node transaction (from txCache)
 * @param {string} address Address being viewed
 * @param {Object} options
 * @param {string} options.token Selected token uid
 * @param {string} options.nativeTokenUid UID of the native token
 * @param {function(string): Object|undefined} [options.getTx] Cached tx by id
 * @returns {{ received: boolean, sent: boolean, fullShielded: boolean }}
 *   `fullShielded` when a counted entry hides its token
 */
export function getConfidentialInvolvement(
  tx,
  address,
  { token, nativeTokenUid, getTx = () => {} }
) {
  const involvement = { received: false, sent: false, fullShielded: false };
  if (!tx) {
    return involvement;
  }

  const counts = entryTokenUid => {
    if (entryTokenUid === null) {
      involvement.fullShielded = true;
      return true;
    }
    return entryTokenUid === undefined || entryTokenUid === token;
  };

  for (const output of tx.shielded_outputs || []) {
    if (
      output?.decoded?.address === address &&
      counts(shieldedEntryToken(output, tx.tokens, nativeTokenUid))
    ) {
      involvement.received = true;
    }
  }

  for (const input of tx.inputs || []) {
    if (isShieldedInput(input) && input?.decoded?.address === address) {
      const parentTokens = getTx(input.tx_id)?.tokens;
      if (counts(shieldedEntryToken(input, parentTokens, nativeTokenUid))) {
        involvement.sent = true;
      }
    }
  }

  return involvement;
}

/**
 * Parents the AmountShielded inputs of `address` need to resolve their token:
 * the ones whose `token_data` points to a custom token of the parent tx.
 *
 * @param {Object} tx Full-node transaction
 * @param {string} address Address being viewed
 * @returns {string[]} Parent tx ids
 */
export function shieldedInputParentIds(tx, address) {
  return (tx?.inputs || [])
    .filter(
      input =>
        isShieldedInput(input) &&
        input?.decoded?.address === address &&
        input.mode === AMOUNT_SHIELDED_MODE &&
        ((input.token_data ?? 0) & TOKEN_INDEX_MASK) !== 0
    )
    .map(input => input.tx_id);
}

/**
 * Whether `address` has a transparent input or output of `token` in the tx,
 * i.e. whether a public balance for that token can come from this tx.
 *
 * @param {Object} tx Full-node transaction
 * @param {string} address Address being viewed
 * @param {string} token Selected token uid
 * @param {string} nativeTokenUid UID of the native token
 * @returns {boolean}
 */
export function hasPublicInvolvement(tx, address, token, nativeTokenUid) {
  const transparent = [
    ...(tx?.outputs || []),
    ...(tx?.inputs || []).filter(input => !isShieldedInput(input)),
  ];
  return transparent.some(
    entry =>
      entry?.decoded?.address === address &&
      (entry.token ?? entryToken(entry, tx.tokens, nativeTokenUid)) === token
  );
}

/**
 * Whether every transparent input and output of `address` in the tx is an
 * authority, and there is at least one.
 *
 * @param {Object} tx Full-node transaction
 * @param {string} address Address being viewed
 * @returns {boolean}
 */
export function isAuthorityOnly(tx, address) {
  const entries = [
    ...(tx?.outputs || []),
    ...(tx?.inputs || []).filter(input => !isShieldedInput(input)),
  ].filter(entry => entry?.decoded?.address === address);
  return (
    entries.length > 0 &&
    entries.every(entry => ((entry.token_data ?? 0) & TOKEN_AUTHORITY_MASK) !== 0)
  );
}

/**
 * How the address history renders a row.
 *
 * `value`:
 * - 'loading': no public value moved and the tx isn't loaded yet, so it's not
 *   known whether the row is confidential.
 * - 'authority': the address only has authorities in the tx.
 * - 'public': the public balance alone.
 * - 'public-and-confidential': the public balance plus a confidential badge.
 * - 'confidential': only the confidential badge. Also used when the row has a
 *   balance but the address has no transparent entry of the token in the tx:
 *   that balance can't be public, so it isn't shown.
 *
 * `direction` is 'received' or 'sent' (from the balance sign, or from the
 * shielded entries when no public value is shown; spending a shielded output
 * wins over shielded change back to the address), or null.
 *
 * `authority` when the address only has authorities among its transparent
 * entries and no public value moved; the row is labeled "Authority" even if
 * it also has confidential entries.
 *
 * A row of the confidential history (null `balance` and `token`) is always
 * 'confidential': the explorer-service lists it for its FullShielded entries.
 *
 * @param {Object} params
 * @param {number|bigint|null} params.balance Public net balance of the row for the selected
 *   token, null on the confidential history
 * @param {Object|null|undefined} params.tx Full-node tx: undefined while loading, null if the fetch failed
 * @param {string} params.address Address being viewed
 * @param {string|null} params.token Selected token uid, null on the confidential history
 * @param {string} params.nativeTokenUid UID of the native token
 * @param {function(string): Object|undefined} [params.getTx] Cached tx by id
 * @returns {{ value: string, direction: 'received'|'sent'|null, amountOnly: boolean, authority: boolean }}
 *   `amountOnly` when every confidential entry shows its token (AmountShielded)
 */
export function describeHistoryRow({ balance, tx, address, token, nativeTokenUid, getTx }) {
  const publicDirection = (balance > 0 && 'received') || (balance < 0 && 'sent') || null;
  const row = (value, direction, authority = false) => ({
    value,
    direction,
    amountOnly: false,
    authority,
  });

  const hidden = balance === null;

  if (tx === undefined) {
    return publicDirection ? row('public', publicDirection) : row('loading', null);
  }
  if (tx === null) {
    return row(hidden ? 'confidential' : 'public', publicDirection);
  }

  const involvement = getConfidentialInvolvement(tx, address, { token, nativeTokenUid, getTx });
  const confidential = hidden || involvement.received || involvement.sent;
  const authority = !publicDirection && isAuthorityOnly(tx, address);

  if (!confidential) {
    return authority ? row('authority', null, true) : row('public', publicDirection);
  }

  const amountOnly = !hidden && !involvement.fullShielded;
  if (!publicDirection || !hasPublicInvolvement(tx, address, token, nativeTokenUid)) {
    const shieldedDirection =
      (involvement.sent && 'sent') || (involvement.received && 'received') || null;
    return {
      value: 'confidential',
      direction: authority ? null : shieldedDirection,
      amountOnly,
      authority,
    };
  }
  return { value: 'public-and-confidential', direction: publicDirection, amountOnly, authority };
}
