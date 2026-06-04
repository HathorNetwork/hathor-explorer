/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { txHasConfidentialForAddress, describeAddressValue } from './shieldedOutputs';

const ADDR = 'HR7JvXSbg8mdvXopKtc97C64NR4TZmQE3T';

describe('txHasConfidentialForAddress', () => {
  it('returns false for an undefined tx', () => {
    expect(txHasConfidentialForAddress(undefined, ADDR)).toBe(false);
  });

  it('returns false when there are no shielded outputs or inputs', () => {
    const tx = { outputs: [{ decoded: { address: ADDR } }], inputs: [] };
    expect(txHasConfidentialForAddress(tx, ADDR)).toBe(false);
  });

  it('detects a shielded output for the address', () => {
    const tx = { shielded_outputs: [{ commitment: 'aa', decoded: { address: ADDR } }] };
    expect(txHasConfidentialForAddress(tx, ADDR)).toBe(true);
  });

  it('ignores a shielded output for a different address', () => {
    const tx = { shielded_outputs: [{ commitment: 'aa', decoded: { address: 'OTHER' } }] };
    expect(txHasConfidentialForAddress(tx, ADDR)).toBe(false);
  });

  it('detects a shielded input for the address', () => {
    const tx = { inputs: [{ type: 'shielded', decoded: { address: ADDR } }] };
    expect(txHasConfidentialForAddress(tx, ADDR)).toBe(true);
  });

  it('ignores a transparent input for the address', () => {
    const tx = { inputs: [{ type: 'p2pkh', decoded: { address: ADDR } }] };
    expect(txHasConfidentialForAddress(tx, ADDR)).toBe(false);
  });
});

describe('describeAddressValue', () => {
  it('returns value-only when there is no confidential activity', () => {
    expect(describeAddressValue({ balance: 100, hasConfidential: false })).toBe('value-only');
  });

  it('returns confidential-only when confidential and the public balance is zero', () => {
    expect(describeAddressValue({ balance: 0, hasConfidential: true })).toBe('confidential-only');
  });

  it('returns value-and-confidential when confidential and the public balance is non-zero', () => {
    expect(describeAddressValue({ balance: 120, hasConfidential: true })).toBe(
      'value-and-confidential'
    );
  });
});
