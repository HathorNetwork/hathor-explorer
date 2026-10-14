/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getConfidentialInvolvement, describeAddressValue } from './shieldedOutputs';

const ADDR = 'HR7JvXSbg8mdvXopKtc97C64NR4TZmQE3T';
const NONE = { received: false, sent: false };

describe('getConfidentialInvolvement', () => {
  it('returns no involvement for an undefined tx', () => {
    expect(getConfidentialInvolvement(undefined, ADDR)).toEqual(NONE);
  });

  it('returns no involvement when there are no shielded outputs or inputs', () => {
    const tx = { outputs: [{ decoded: { address: ADDR } }], inputs: [] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual(NONE);
  });

  it('detects a shielded output for the address as received', () => {
    const tx = { shielded_outputs: [{ commitment: 'aa', decoded: { address: ADDR } }] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual({ received: true, sent: false });
  });

  it('ignores a shielded output for a different address', () => {
    const tx = { shielded_outputs: [{ commitment: 'aa', decoded: { address: 'OTHER' } }] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual(NONE);
  });

  it('ignores a shielded output without a decoded address', () => {
    const tx = { shielded_outputs: [{ commitment: 'aa' }] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual(NONE);
  });

  it('detects a shielded input for the address as sent', () => {
    const tx = { inputs: [{ type: 'shielded', decoded: { address: ADDR } }] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual({ received: false, sent: true });
  });

  it('detects a full unshield (shielded inputs, no shielded outputs) as sent', () => {
    const tx = {
      inputs: [{ type: 'shielded', decoded: { address: ADDR } }],
      outputs: [{ decoded: { address: 'OTHER' } }],
    };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual({ received: false, sent: true });
  });

  it('reports both directions for a shielded spend with shielded change', () => {
    const tx = {
      inputs: [{ type: 'shielded', decoded: { address: ADDR } }],
      shielded_outputs: [{ commitment: 'aa', decoded: { address: ADDR } }],
    };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual({ received: true, sent: true });
  });

  it('ignores a transparent input for the address', () => {
    const tx = { inputs: [{ type: 'p2pkh', decoded: { address: ADDR } }] };
    expect(getConfidentialInvolvement(tx, ADDR)).toEqual(NONE);
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
