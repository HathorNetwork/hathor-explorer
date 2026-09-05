/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { calculateAddressBalance } from './addressBalance';

const addr = 'HAddress';
const token = '00';
const notAuthority = () => false;

const io = (value, { address = addr, tokenUid = token } = {}) => ({
  value,
  token: tokenUid,
  decoded: { address },
});

describe('calculateAddressBalance', () => {
  it('returns outputs minus inputs for the selected token/address as BigInt', () => {
    const tx = { inputs: [io(200)], outputs: [io(500)] };
    expect(calculateAddressBalance(tx, token, addr, notAuthority)).toBe(300n);
  });

  it('preserves precision for values above Number.MAX_SAFE_INTEGER', () => {
    const tx = {
      inputs: [io(1000000000000000000n)],
      outputs: [io(3000000000000000000n)],
    };
    expect(calculateAddressBalance(tx, token, addr, notAuthority)).toBe(2000000000000000000n);
  });

  it('ignores authority outputs', () => {
    const isAuthority = entry => entry.value === 999n;
    const tx = { inputs: [], outputs: [io(999n), io(500)] };
    expect(calculateAddressBalance(tx, token, addr, isAuthority)).toBe(500n);
  });

  it('ignores entries for other tokens or addresses', () => {
    const tx = {
      inputs: [io(100, { address: 'Other' })],
      outputs: [io(700, { tokenUid: '01' }), io(400)],
    };
    expect(calculateAddressBalance(tx, token, addr, notAuthority)).toBe(400n);
  });

  it('skips inputs/outputs without a decoded script instead of throwing', () => {
    const tx = {
      inputs: [{ value: 100, token, decoded: undefined }],
      outputs: [{ value: 300, token, decoded: null }, io(600)],
    };
    expect(calculateAddressBalance(tx, token, addr, notAuthority)).toBe(600n);
  });
});
