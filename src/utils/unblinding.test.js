/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import {
  MAX_UNBLINDING_PAYLOAD_LENGTH,
  parseUnblindingPayload,
  stripUnblindFromHash,
  verifyUnblindingEntry,
} from './unblinding';

// Same encoding as wallet-lib's `shielded.encodeShieldedUnblindingPayload`.
const encode = obj =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const TX = `aabbccdd${'0'.repeat(56)}`;
const TOKEN = 'ab'.repeat(32);
const VBF = '11'.repeat(32);
const ABF = '22'.repeat(32);

const payloadWith = (outputs, extra = {}) => encode({ v: 1, txId: TX, outputs, ...extra });
const entry = (overrides = {}) => ({ index: 0, value: '250', token: '00', vbf: VBF, ...overrides });

describe('parseUnblindingPayload', () => {
  it('parses outputs and inputs into maps keyed by index', () => {
    const payload = payloadWith(
      [entry({ index: 1 }), entry({ index: 3, value: '999', token: TOKEN, abf: ABF })],
      { inputs: [entry({ index: 0, value: '7' })] }
    );
    const result = parseUnblindingPayload(payload, TX);
    expect(result.error).toBeUndefined();
    expect(result.outputs.get(1)).toEqual({
      index: 1,
      value: 250n,
      token: '00',
      vbf: VBF,
      abf: undefined,
    });
    expect(result.outputs.get(3)).toMatchObject({ value: 999n, token: TOKEN, abf: ABF });
    expect(result.inputs.get(0).value).toBe(7n);
  });

  it('treats a missing inputs list as no inputs', () => {
    const result = parseUnblindingPayload(payloadWith([entry()]), TX);
    expect(result.inputs.size).toBe(0);
  });

  it('lowercases hex fields', () => {
    const payload = payloadWith([entry({ token: TOKEN.toUpperCase(), vbf: VBF.toUpperCase() })]);
    const result = parseUnblindingPayload(payload, TX.toUpperCase());
    expect(result.outputs.get(0)).toMatchObject({ token: TOKEN, vbf: VBF });
  });

  it('reads the payload from a URL, ignoring other fragment parameters', () => {
    const payload = payloadWith([entry()]);
    const url = `https://explorer.testnet.hathor.network/transaction/${TX}#section=outputs&unblind=${payload}&x=1`;
    const result = parseUnblindingPayload(url, TX);
    expect(result.error).toBeUndefined();
    expect(result.outputs.size).toBe(1);
  });

  it('accepts the largest amount below 2^64', () => {
    const max = ((1n << 64n) - 1n).toString();
    const result = parseUnblindingPayload(payloadWith([entry({ value: max })]), TX);
    expect(result.outputs.get(0).value).toBe((1n << 64n) - 1n);
  });

  it.each([
    ['2^64', (1n << 64n).toString()],
    ['a negative amount', '-1'],
    ['a decimal amount', '1.5'],
    ['a leading zero', '01'],
    ['an empty amount', ''],
    ['a number instead of a string', 250],
  ])('rejects %s', (_label, value) => {
    const result = parseUnblindingPayload(payloadWith([entry({ value })]), TX);
    expect(result.error).toMatch(/amount/);
  });

  it.each([
    ['a short token', { token: 'abcd' }, /token/],
    ['a token with trailing junk', { token: `${TOKEN}zz` }, /token/],
    ['a short vbf', { vbf: '11'.repeat(31) }, /value blinding factor/],
    ['a non-hex vbf', { vbf: `${'11'.repeat(31)}zz` }, /value blinding factor/],
    ['a short abf', { abf: '22' }, /asset blinding factor/],
    ['a negative index', { index: -1 }, /index/],
    ['a string index', { index: '1' }, /index/],
  ])('rejects an entry with %s', (_label, overrides, error) => {
    const result = parseUnblindingPayload(payloadWith([entry(overrides)]), TX);
    expect(result.error).toMatch(error);
  });

  it('rejects an index listed twice', () => {
    const result = parseUnblindingPayload(payloadWith([entry(), entry()]), TX);
    expect(result.error).toMatch(/twice/);
  });

  it('rejects a payload for a different tx', () => {
    expect(parseUnblindingPayload(payloadWith([]), 'f'.repeat(64)).error).toMatch(/different tx/);
  });

  it('rejects a payload without a valid txId', () => {
    expect(parseUnblindingPayload(encode({ v: 1, outputs: [] }), TX).error).toMatch(/txId/);
    expect(parseUnblindingPayload(encode({ v: 1, txId: 'abc', outputs: [] })).error).toMatch(
      /txId/
    );
  });

  it('never throws on a crafted version, and never echoes its text', () => {
    const objectV = encode({ v: { toString: 1 }, txId: TX, outputs: [] });
    expect(parseUnblindingPayload(objectV, TX).error).toBe(
      'unsupported unblinding payload version'
    );

    // Built by hand: JSON.stringify itself overflows on this depth.
    const deepJson = `{"v":${'['.repeat(20000)}1${']'.repeat(20000)},"txId":"${TX}","outputs":[]}`;
    const deepV = Buffer.from(deepJson)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(() => parseUnblindingPayload(deepV, TX)).not.toThrow();
    expect(parseUnblindingPayload(deepV, TX).error).toBeDefined();

    const textV = encode({ v: 'Restore your wallet at evil.example', txId: TX, outputs: [] });
    expect(parseUnblindingPayload(textV, TX).error).toBe('unsupported unblinding payload version');
    expect(parseUnblindingPayload(payloadWith([], { v: 2 }), TX).error).toBe(
      'unsupported unblinding payload version (got 2)'
    );
  });

  it('rejects an unsupported version', () => {
    expect(parseUnblindingPayload(payloadWith([], { v: 2 }), TX).error).toMatch(/version/);
  });

  it('rejects missing or malformed lists', () => {
    expect(parseUnblindingPayload(encode({ v: 1, txId: TX }), TX).error).toMatch(/outputs/);
    expect(parseUnblindingPayload(payloadWith([], { inputs: {} }), TX).error).toMatch(/inputs/);
    expect(parseUnblindingPayload(payloadWith([null]), TX).error).toMatch(/malformed/);
  });

  it('rejects empty input', () => {
    expect(parseUnblindingPayload('', TX).error).toMatch(/empty/);
    expect(parseUnblindingPayload('   ', TX).error).toMatch(/empty/);
    expect(parseUnblindingPayload(null, TX).error).toMatch(/empty/);
  });

  it('rejects characters outside base64url', () => {
    expect(parseUnblindingPayload('not valid !!! base64', TX).error).toMatch(/base64url/);
  });

  it('rejects base64url that is not JSON', () => {
    const notJson = Buffer.from('hello')
      .toString('base64')
      .replace(/=+$/, '');
    expect(parseUnblindingPayload(notJson, TX).error).toMatch(/JSON/);
  });

  it('rejects a payload above the length cap', () => {
    const tooLong = 'A'.repeat(MAX_UNBLINDING_PAYLOAD_LENGTH + 1);
    expect(parseUnblindingPayload(tooLong, TX).error).toMatch(/too long/);
  });
});

describe('verifyUnblindingEntry', () => {
  const COMMITMENT = '08'.repeat(33);
  const ASSET_COMMITMENT = '0a'.repeat(33);
  const OTHER = '09'.repeat(33);

  const amountShielded = { mode: 1, commitment: COMMITMENT, token_data: 0 };
  const fullShielded = { mode: 2, commitment: COMMITMENT, asset_commitment: ASSET_COMMITMENT };

  const parsedEntry = (overrides = {}) => ({
    index: 0,
    value: 250n,
    token: '00',
    vbf: VBF,
    abf: undefined,
    ...overrides,
  });

  const fakeProvider = ({
    valueCommitment = COMMITMENT,
    assetCommitment = ASSET_COMMITMENT,
  } = {}) => ({
    openAmountShieldedCommitment: jest.fn(async () => Buffer.from(valueCommitment, 'hex')),
    openFullShieldedCommitment: jest.fn(async () => ({
      valueCommitment: Buffer.from(valueCommitment, 'hex'),
      assetCommitment: Buffer.from(assetCommitment, 'hex'),
    })),
  });

  it('verifies an AmountShielded opening, padding HTR to 32 bytes', async () => {
    const provider = fakeProvider();
    const result = await verifyUnblindingEntry(parsedEntry(), amountShielded, provider);
    expect(result).toEqual({ state: 'verified', value: 250n, tokenUid: '00' });
    const [value, vbf, token] = provider.openAmountShieldedCommitment.mock.calls[0];
    expect(value).toBe(250n);
    expect(vbf.toString('hex')).toBe(VBF);
    expect(token.toString('hex')).toBe('0'.repeat(64));
  });

  it('rejects an AmountShielded opening that does not match', async () => {
    const provider = fakeProvider({ valueCommitment: OTHER });
    const result = await verifyUnblindingEntry(parsedEntry(), amountShielded, provider);
    expect(result).toEqual({ state: 'mismatch', reason: 'commitment mismatch' });
  });

  it('verifies a FullShielded opening against both commitments', async () => {
    const provider = fakeProvider();
    const opening = parsedEntry({ token: TOKEN, abf: ABF });
    const result = await verifyUnblindingEntry(opening, fullShielded, provider);
    expect(result).toEqual({ state: 'verified', value: 250n, tokenUid: TOKEN });
    const [, , token, abf] = provider.openFullShieldedCommitment.mock.calls[0];
    expect(token.toString('hex')).toBe(TOKEN);
    expect(abf.toString('hex')).toBe(ABF);
  });

  it('rejects a FullShielded opening whose asset commitment does not match', async () => {
    const provider = fakeProvider({ assetCommitment: OTHER });
    const opening = parsedEntry({ token: TOKEN, abf: ABF });
    const result = await verifyUnblindingEntry(opening, fullShielded, provider);
    expect(result.state).toBe('mismatch');
  });

  it('rejects a FullShielded opening whose value commitment does not match', async () => {
    const provider = fakeProvider({ valueCommitment: OTHER });
    const opening = parsedEntry({ token: TOKEN, abf: ABF });
    const result = await verifyUnblindingEntry(opening, fullShielded, provider);
    expect(result.state).toBe('mismatch');
  });

  it('reports an output of an unknown mode as an error', async () => {
    const provider = fakeProvider();
    const result = await verifyUnblindingEntry(
      parsedEntry(),
      { ...amountShielded, mode: 3 },
      provider
    );
    expect(result).toEqual({ state: 'error', reason: 'unknown shielded mode 3' });
    expect(provider.openAmountShieldedCommitment).not.toHaveBeenCalled();
  });

  it('rejects an entry whose mode does not match the output', async () => {
    const provider = fakeProvider();
    const withoutAbf = await verifyUnblindingEntry(parsedEntry(), fullShielded, provider);
    expect(withoutAbf.state).toBe('mismatch');
    const withAbf = await verifyUnblindingEntry(
      parsedEntry({ abf: ABF }),
      amountShielded,
      provider
    );
    expect(withAbf.state).toBe('mismatch');
  });

  it('reports invalid on-chain data as an error', async () => {
    const result = await verifyUnblindingEntry(
      parsedEntry(),
      { ...amountShielded, commitment: 'xyz' },
      fakeProvider()
    );
    expect(result.state).toBe('error');
  });

  it('reports a provider failure as an error', async () => {
    const provider = fakeProvider();
    provider.openAmountShieldedCommitment.mockRejectedValue(new Error('amount out of range'));
    const result = await verifyUnblindingEntry(parsedEntry(), amountShielded, provider);
    expect(result).toEqual({ state: 'error', reason: 'amount out of range' });
  });
});

describe('stripUnblindFromHash', () => {
  it('removes the payload and keeps the other parameters', () => {
    expect(stripUnblindFromHash('#section=outputs&unblind=abc')).toBe('section=outputs');
    expect(stripUnblindFromHash('#unblind=abc')).toBe('');
    expect(stripUnblindFromHash('')).toBe('');
  });
});
