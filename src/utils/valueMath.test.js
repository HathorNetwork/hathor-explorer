/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { subtractValues } from './valueMath';

describe('subtractValues', () => {
  it('subtracts a chain of operands and returns a BigInt', () => {
    // total spent = total_received - unlocked - locked
    expect(subtractValues(1000, 300, 200)).toBe(500n);
  });

  it('preserves exact precision for operands above Number.MAX_SAFE_INTEGER', () => {
    // 3 * 10^18 - 1 * 10^18 - 1 * 10^18 = 1 * 10^18
    expect(subtractValues(3000000000000000000n, 1000000000000000000n, 1000000000000000000n)).toBe(
      1000000000000000000n
    );
  });

  it('normalizes mixed Number and BigInt operands without throwing', () => {
    expect(subtractValues(2000000000000000000n, 500)).toBe(1999999999999999500n);
  });

  it('supports a single subtrahend (received - spent)', () => {
    expect(subtractValues(700, 250)).toBe(450n);
  });
});
