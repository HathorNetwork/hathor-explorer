/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Subtract a chain of amount operands with full integer precision.
 *
 * Amounts arrive as either Number (within the safe range) or BigInt (large,
 * from JSONBigInt parsing). Native arithmetic throws when the two are mixed and
 * loses precision above 2^53 for Number. This normalizes every operand to BigInt
 * so the result is always exact.
 *
 * @param {number|bigint|string} minuend Value to subtract from
 * @param {...(number|bigint|string)} subtrahends Values to subtract
 * @return {bigint} The exact difference
 */
export function subtractValues(minuend, ...subtrahends) {
  return subtrahends.reduce((acc, value) => acc - BigInt(value), BigInt(minuend));
}

export default subtractValues;
