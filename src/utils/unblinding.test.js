/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';

// Stub the setup module so the parser tests don't transitively pull
// hathor-wallet-lib (which ships ES modules that the CRA jest config
// doesn't transform out of node_modules). The parser has no real
// dependency on the crypto provider — only the verifier does.
jest.mock('../setupShieldedCrypto', () => ({
  getShieldedCryptoProvider: () => null,
  setupShieldedCrypto: async () => null,
}));

const { parseUnblindingPayload } = require('./unblinding');

const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const TX = 'aabbccdd00000000000000000000000000000000000000000000000000000000';

describe('parseUnblindingPayload', () => {
  it('parses a valid base64url payload into an indexed map', () => {
    const payload = encode({
      v: 1,
      txId: TX,
      outputs: [
        { index: 1, value: '250', token: '00', vbf: 'cafe' },
        { index: 3, value: '999', token: '0102', vbf: 'beef', abf: 'dead' },
      ],
    });
    const result = parseUnblindingPayload(payload, TX);
    expect(result.error).toBeUndefined();
    expect(result.outputs.size).toBe(2);
    expect(result.outputs.get(1)).toEqual({
      index: 1,
      value: '250',
      token: '00',
      vbf: 'cafe',
      abf: undefined,
    });
    expect(result.outputs.get(3).abf).toBe('dead');
  });

  it('strips a full URL down to the unblind= fragment', () => {
    const payload = encode({ v: 1, txId: TX, outputs: [] });
    const url = `https://explorer.testnet.hathor.network/transaction/${TX}#unblind=${payload}`;
    const result = parseUnblindingPayload(url, TX);
    expect(result.error).toBeUndefined();
    expect(result.outputs.size).toBe(0);
  });

  it('rejects a payload for a different tx', () => {
    const payload = encode({ v: 1, txId: TX, outputs: [] });
    const result = parseUnblindingPayload(payload, '0'.repeat(64));
    expect(result.error).toMatch(/different tx/);
  });

  it('rejects a payload with an unsupported schema version', () => {
    const payload = encode({ v: 99, txId: TX, outputs: [] });
    const result = parseUnblindingPayload(payload, TX);
    expect(result.error).toMatch(/unsupported.*version/);
  });

  it('rejects a malformed entry', () => {
    const payload = encode({
      v: 1,
      txId: TX,
      outputs: [{ index: 'not-a-number', value: '1', token: '00', vbf: 'aa' }],
    });
    const result = parseUnblindingPayload(payload, TX);
    expect(result.error).toMatch(/malformed/);
  });

  it('rejects empty input', () => {
    expect(parseUnblindingPayload('', TX).error).toMatch(/empty/);
    expect(parseUnblindingPayload(null, TX).error).toMatch(/empty/);
  });

  it('rejects non-base64 input', () => {
    expect(parseUnblindingPayload('not valid !!! base64', TX).error).toBeDefined();
  });
});
