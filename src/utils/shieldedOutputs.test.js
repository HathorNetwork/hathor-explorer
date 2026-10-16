/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  describeHistoryRow,
  getConfidentialInvolvement,
  hasPublicInvolvement,
  isAuthorityOnly,
  shieldedInputParentIds,
} from './shieldedOutputs';

const ADDR = 'HR7JvXSbg8mdvXopKtc97C64NR4TZmQE3T';
const OTHER = 'HOTHERxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const HTR = '00';
const TKA = '00aa';
const TKB = '00bb';
const opts = { token: HTR, nativeTokenUid: HTR };

const fullShieldedOutput = (address = ADDR) => ({ mode: 2, decoded: { address } });
const amountShieldedOutput = (tokenData, address = ADDR) => ({
  mode: 1,
  token_data: tokenData,
  decoded: { address },
});
const shieldedInput = (fields, address = ADDR) => ({
  type: 'shielded',
  tx_id: 'parent',
  decoded: { address },
  ...fields,
});
const output = (tokenData, address = ADDR) => ({ token_data: tokenData, decoded: { address } });

describe('getConfidentialInvolvement', () => {
  it('returns no involvement for an undefined tx', () => {
    expect(getConfidentialInvolvement(undefined, ADDR, opts)).toEqual({
      received: false,
      sent: false,
      fullShielded: false,
    });
  });

  it('ignores transparent outputs and inputs', () => {
    const tx = { outputs: [output(0)], inputs: [{ type: 'transparent', ...output(0) }] };
    expect(getConfidentialInvolvement(tx, ADDR, opts)).toMatchObject({
      received: false,
      sent: false,
    });
  });

  it('counts a FullShielded output for every token', () => {
    const tx = { tokens: [{ uid: TKA }], shielded_outputs: [fullShieldedOutput()] };
    for (const token of [HTR, TKA, TKB]) {
      expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token })).toEqual({
        received: true,
        sent: false,
        fullShielded: true,
      });
    }
  });

  it('counts an AmountShielded output only for its own token', () => {
    const tx = { tokens: [{ uid: TKA }], shielded_outputs: [amountShieldedOutput(1)] };
    expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token: TKA })).toEqual({
      received: true,
      sent: false,
      fullShielded: false,
    });
    expect(getConfidentialInvolvement(tx, ADDR, opts).received).toBe(false);
  });

  it('resolves an AmountShielded HTR output without the token list', () => {
    const tx = { tokens: [], shielded_outputs: [amountShieldedOutput(0)] };
    expect(getConfidentialInvolvement(tx, ADDR, opts).received).toBe(true);
    expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token: TKA }).received).toBe(false);
  });

  it('ignores shielded outputs of other addresses and without a decoded address', () => {
    const tx = { shielded_outputs: [fullShieldedOutput(OTHER), { mode: 2 }] };
    expect(getConfidentialInvolvement(tx, ADDR, opts).received).toBe(false);
  });

  it('resolves an AmountShielded input token from its parent tx', () => {
    const tx = { tokens: [{ uid: TKB }], inputs: [shieldedInput({ mode: 1, token_data: 1 })] };
    const getTx = id => (id === 'parent' ? { tokens: [{ uid: TKA }] } : undefined);
    expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token: TKA, getTx }).sent).toBe(true);
    expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token: TKB, getTx }).sent).toBe(false);
  });

  it('counts an AmountShielded input while its parent is unknown', () => {
    const tx = { inputs: [shieldedInput({ mode: 1, token_data: 1 })] };
    expect(getConfidentialInvolvement(tx, ADDR, { ...opts, token: TKA }).sent).toBe(true);
  });

  it('counts a full unshield (shielded inputs, no shielded outputs) as sent', () => {
    const tx = { inputs: [shieldedInput({ mode: 2 })], outputs: [output(0, OTHER)] };
    expect(getConfidentialInvolvement(tx, ADDR, opts)).toEqual({
      received: false,
      sent: true,
      fullShielded: true,
    });
  });
});

describe('shieldedInputParentIds', () => {
  it('lists parents of AmountShielded inputs of custom tokens for the address', () => {
    const tx = {
      inputs: [
        shieldedInput({ mode: 1, token_data: 1, tx_id: 'custom' }),
        shieldedInput({ mode: 1, token_data: 0, tx_id: 'htr' }),
        shieldedInput({ mode: 2, tx_id: 'full' }),
        shieldedInput({ mode: 1, token_data: 1, tx_id: 'other' }, OTHER),
        { ...output(1), tx_id: 'transparent' },
      ],
    };
    expect(shieldedInputParentIds(tx, ADDR)).toEqual(['custom']);
  });
});

describe('hasPublicInvolvement', () => {
  it('matches a transparent output or input of the token', () => {
    const tx = { tokens: [{ uid: TKA }], outputs: [output(1)], inputs: [] };
    expect(hasPublicInvolvement(tx, ADDR, TKA, HTR)).toBe(true);
    expect(hasPublicInvolvement(tx, ADDR, HTR, HTR)).toBe(false);
  });

  it('ignores shielded inputs', () => {
    const tx = { inputs: [shieldedInput({ mode: 1, token_data: 0 })] };
    expect(hasPublicInvolvement(tx, ADDR, HTR, HTR)).toBe(false);
  });
});

describe('isAuthorityOnly', () => {
  it('needs at least one authority entry of the address', () => {
    expect(isAuthorityOnly({ outputs: [], inputs: [] }, ADDR)).toBe(false);
    expect(isAuthorityOnly({ outputs: [output(0b10000001)], inputs: [] }, ADDR)).toBe(true);
  });

  it('is false when the address also has a non-authority entry', () => {
    const tx = { outputs: [output(0b10000001), output(1)], inputs: [] };
    expect(isAuthorityOnly(tx, ADDR)).toBe(false);
  });
});

describe('describeHistoryRow', () => {
  const describe_ = params =>
    describeHistoryRow({ address: ADDR, token: HTR, nativeTokenUid: HTR, ...params });

  it('waits for the tx when no public value moved', () => {
    expect(describe_({ balance: 0, tx: undefined }).value).toBe('loading');
  });

  it('shows a public balance right away while the tx loads', () => {
    expect(describe_({ balance: 10, tx: undefined })).toMatchObject({
      value: 'public',
      direction: 'received',
    });
  });

  it('falls back to the public balance when the tx fetch failed', () => {
    expect(describe_({ balance: 0, tx: null })).toMatchObject({ value: 'public', direction: null });
  });

  it('shows only the badge for a shielded-only receive', () => {
    const tx = { shielded_outputs: [fullShieldedOutput()], outputs: [], inputs: [] };
    expect(describe_({ balance: 0, tx })).toEqual({
      value: 'confidential',
      direction: 'received',
      amountOnly: false,
      authority: false,
    });
  });

  it('labels a shielded spend with shielded change as sent', () => {
    const tx = {
      shielded_outputs: [fullShieldedOutput()],
      inputs: [shieldedInput({ mode: 2 })],
      outputs: [],
    };
    expect(describe_({ balance: 0, tx }).direction).toBe('sent');
  });

  it('marks an AmountShielded-only row as amount-only', () => {
    const tx = { tokens: [], shielded_outputs: [amountShieldedOutput(0)], outputs: [], inputs: [] };
    expect(describe_({ balance: 0, tx }).amountOnly).toBe(true);
  });

  it('shows the public balance plus the badge for a mixed tx', () => {
    const tx = { shielded_outputs: [fullShieldedOutput()], outputs: [output(0)], inputs: [] };
    expect(describe_({ balance: -5, tx })).toMatchObject({
      value: 'public-and-confidential',
      direction: 'sent',
    });
  });

  it('hides a balance the address has no transparent entry of the token for', () => {
    const tx = { shielded_outputs: [fullShieldedOutput()], outputs: [], inputs: [] };
    expect(describe_({ balance: 120, tx })).toMatchObject({
      value: 'confidential',
      direction: 'received',
    });
  });

  it('ignores an AmountShielded output of another token', () => {
    const tx = {
      tokens: [{ uid: TKA }],
      shielded_outputs: [amountShieldedOutput(1)],
      outputs: [output(0)],
      inputs: [],
    };
    expect(describe_({ balance: 10, tx }).value).toBe('public');
  });

  it('labels an authority-only tx as authority, even with a confidential entry', () => {
    const authorityTx = { outputs: [output(0b10000001)], inputs: [] };
    expect(describe_({ balance: 0, tx: authorityTx })).toMatchObject({
      value: 'authority',
      authority: true,
    });
    const tx = { ...authorityTx, shielded_outputs: [fullShieldedOutput()] };
    expect(describe_({ balance: 0, tx })).toMatchObject({
      value: 'confidential',
      direction: null,
      authority: true,
    });
  });

  it('shows a zero balance without confidential entries as public', () => {
    const tx = { outputs: [output(0)], inputs: [{ type: 'transparent', ...output(0) }] };
    expect(describe_({ balance: 0, tx })).toMatchObject({ value: 'public', direction: null });
  });
});
