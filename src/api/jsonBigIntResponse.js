/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import hathorLib from '@hathor/wallet-lib';

/**
 * Parse an Explorer Service HTTP response body preserving full integer precision.
 *
 * At 18 decimal places, base-unit amounts routinely exceed Number.MAX_SAFE_INTEGER
 * (~2^53), which the default JSON.parse silently rounds. This uses wallet-lib's
 * JSONBigInt, which upgrades only out-of-safe-range integers to BigInt and leaves
 * everything else (timestamps, heights, counts, floats) as Number.
 *
 * It is defensive so it can be used as an Axios `transformResponse`: non-string or
 * empty bodies are returned as-is, and non-JSON bodies (e.g. graphviz output) fall
 * back to the raw string instead of throwing.
 *
 * @param {*} data Raw response body (string when coming from Axios)
 * @return {*} Parsed value with BigInt for large integers, or the input unchanged
 */
export function parseJsonBigInt(data) {
  if (typeof data !== 'string' || data.length === 0) {
    return data;
  }

  try {
    return hathorLib.bigIntUtils.JSONBigInt.parse(data);
  } catch (e) {
    return data;
  }
}

export default parseJsonBigInt;
