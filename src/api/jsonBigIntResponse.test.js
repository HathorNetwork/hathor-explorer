/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseJsonBigInt } from './jsonBigIntResponse';

// The full '@hathor/wallet-lib' entrypoint performs heavy initialization that
// hangs a plain Node/Jest import. We only need the (real) bigint utilities, so
// we map the package's `bigIntUtils` to its lightweight submodule. The parsing
// under test is the real JSONBigInt implementation, not a fake. babel-jest
// hoists this jest.mock above the import at transform time.
jest.mock('@hathor/wallet-lib', () => ({
  __esModule: true,
  // eslint-disable-next-line global-require
  default: { bigIntUtils: require('@hathor/wallet-lib/lib/utils/bigint') },
}));

describe('parseJsonBigInt', () => {
  it('parses integers above Number.MAX_SAFE_INTEGER as exact BigInt', () => {
    const result = parseJsonBigInt('{"value": 1234567890123456789}');
    expect(result.value).toBe(1234567890123456789n);
  });

  it('keeps integers within the safe range as Number', () => {
    const result = parseJsonBigInt('{"value": 500}');
    expect(result.value).toBe(500);
    expect(typeof result.value).toBe('number');
  });

  it('returns the raw string unchanged for non-JSON bodies', () => {
    const dot = 'digraph { a -> b }';
    expect(parseJsonBigInt(dot)).toBe(dot);
  });

  it('returns an empty string unchanged', () => {
    expect(parseJsonBigInt('')).toBe('');
  });

  it('returns non-string input unchanged', () => {
    const alreadyParsed = { value: 1n };
    expect(parseJsonBigInt(alreadyParsed)).toBe(alreadyParsed);
  });
});
