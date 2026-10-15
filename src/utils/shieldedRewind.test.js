/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import { HDPrivateKey, Networks } from 'bitcore-lib';
import { parseScanXPrivKey, rewindSlot, rewindSlots } from './shieldedRewind';

const ROOT = HDPrivateKey.fromSeed('00'.repeat(32), Networks.livenet);
const SCAN_KEY = ROOT.deriveChild("m/44'/280'/1'/0");
const VERSION = Networks.livenet.xprivkey;

const COMMITMENT = '08'.repeat(33);
const ASSET_COMMITMENT = '0a'.repeat(33);
const OTHER = '09'.repeat(33);
const TOKEN = 'ab'.repeat(32);

const entry = (overrides = {}) => ({
  mode: 1,
  commitment: COMMITMENT,
  range_proof: Buffer.from('proof').toString('base64'),
  ephemeral_pubkey: '02'.repeat(33),
  ...overrides,
});
const fullEntry = () => entry({ mode: 2, asset_commitment: ASSET_COMMITMENT });

const scanMiss = () =>
  Object.assign(new Error('range proof rewind failed'), { name: 'ScanMissError' });

/**
 * Provider whose rewinds succeed only for `ownKey`, recovering `value`, and
 * whose commitments open to `valueCommitment` / `assetCommitment`.
 */
const fakeProvider = ({
  ownKey,
  value = 250n,
  tokenUid = TOKEN,
  valueCommitment = COMMITMENT,
  assetCommitment = ASSET_COMMITMENT,
} = {}) => {
  const owns = key => !ownKey || key.equals(ownKey);
  return {
    rewindAmountShieldedOutput: jest.fn(async key => {
      if (!owns(key)) throw scanMiss();
      return { value, blindingFactor: Buffer.alloc(32, 1) };
    }),
    rewindFullShieldedOutput: jest.fn(async key => {
      if (!owns(key)) throw scanMiss();
      return {
        value,
        blindingFactor: Buffer.alloc(32, 1),
        tokenUid,
        assetBlindingFactor: Buffer.alloc(32, 2),
      };
    }),
    openAmountShieldedCommitment: jest.fn(async () => Buffer.from(valueCommitment, 'hex')),
    openFullShieldedCommitment: jest.fn(async () => ({
      valueCommitment: Buffer.from(valueCommitment, 'hex'),
      assetCommitment: Buffer.from(assetCommitment, 'hex'),
    })),
  };
};

const childPrivkey = index => SCAN_KEY.deriveChild(index).privateKey.toBuffer({ size: 32 });

describe('parseScanXPrivKey', () => {
  it('accepts the scan key', () => {
    const result = parseScanXPrivKey(` ${SCAN_KEY.xprivkey}\n`, VERSION);
    expect(result.key.xprivkey).toBe(SCAN_KEY.xprivkey);
  });

  it('rejects anything that is not an xpriv', () => {
    expect(parseScanXPrivKey('', VERSION).error).toMatch(/paste/);
    expect(parseScanXPrivKey('not a key', VERSION).error).toMatch(/xpriv/);
    expect(parseScanXPrivKey(SCAN_KEY.xpubkey, VERSION).error).toMatch(/xpriv/);
  });

  it('rejects a key of another network', () => {
    expect(parseScanXPrivKey(SCAN_KEY.xprivkey, Networks.testnet.xprivkey).error).toMatch(
      /another network/
    );
  });

  it('rejects a key at another derivation depth', () => {
    expect(parseScanXPrivKey(ROOT.xprivkey, VERSION).error).toMatch(/scan key/);
    const account = ROOT.deriveChild("m/44'/280'/1'");
    expect(parseScanXPrivKey(account.xprivkey, VERSION).error).toMatch(/scan key/);
  });
});

describe('rewindSlot', () => {
  it('rewinds an AmountShielded entry with its token, padding HTR to 32 bytes', async () => {
    const provider = fakeProvider();
    const result = await rewindSlot(provider, childPrivkey(0), { entry: entry(), tokenUid: '00' });
    expect(result).toEqual({ value: 250n, tokenUid: '00' });
    const token = provider.rewindAmountShieldedOutput.mock.calls[0][4];
    expect(token.toString('hex')).toBe('0'.repeat(64));
  });

  it('recovers the token of a FullShielded entry', async () => {
    const provider = fakeProvider();
    const result = await rewindSlot(provider, childPrivkey(0), { entry: fullEntry() });
    expect(result).toEqual({ value: 250n, tokenUid: TOKEN });
  });

  it('reports the native token as 00', async () => {
    const provider = fakeProvider({ tokenUid: '0'.repeat(64) });
    const result = await rewindSlot(provider, childPrivkey(0), { entry: fullEntry() });
    expect(result.tokenUid).toBe('00');
  });

  it('returns null for an entry paid to another key', async () => {
    const provider = fakeProvider({ ownKey: childPrivkey(1) });
    expect(await rewindSlot(provider, childPrivkey(0), { entry: entry(), tokenUid: '00' })).toBe(
      null
    );
  });

  it('throws when the rewound values do not open the commitments', async () => {
    await expect(
      rewindSlot(fakeProvider({ valueCommitment: OTHER }), childPrivkey(0), {
        entry: entry(),
        tokenUid: '00',
      })
    ).rejects.toThrow(/commitment/);
    await expect(
      rewindSlot(fakeProvider({ assetCommitment: OTHER }), childPrivkey(0), { entry: fullEntry() })
    ).rejects.toThrow(/commitment/);
  });

  it('throws on a non-positive amount', async () => {
    await expect(
      rewindSlot(fakeProvider({ value: 0n }), childPrivkey(0), { entry: entry(), tokenUid: '00' })
    ).rejects.toThrow(/positive/);
  });

  it('passes on errors other than a scan miss', async () => {
    const provider = fakeProvider();
    provider.rewindAmountShieldedOutput.mockRejectedValue(new Error('invalid point'));
    await expect(
      rewindSlot(provider, childPrivkey(0), { entry: entry(), tokenUid: '00' })
    ).rejects.toThrow('invalid point');
  });
});

describe('rewindSlots', () => {
  const slots = [
    { id: 'output:0', entry: entry(), tokenUid: '00' },
    { id: 'output:1', entry: fullEntry() },
  ];

  it('finds the entries paid to an address of the batch', async () => {
    const provider = fakeProvider({ ownKey: childPrivkey(3) });
    const progress = [];
    const found = await rewindSlots({
      provider,
      key: SCAN_KEY,
      slots,
      fromIndex: 0,
      toIndex: 5,
      onProgress: done => progress.push(done),
    });
    expect(found.get('output:0')).toEqual({ value: 250n, tokenUid: '00', addressIndex: 3 });
    expect(found.get('output:1')).toEqual({ value: 250n, tokenUid: TOKEN, addressIndex: 3 });
    // Stops once every entry is found.
    expect(progress).toEqual([1, 2, 3, 4]);
  });

  it('finds nothing outside the batch', async () => {
    const provider = fakeProvider({ ownKey: childPrivkey(7) });
    const found = await rewindSlots({ provider, key: SCAN_KEY, slots, fromIndex: 0, toIndex: 5 });
    expect(found.size).toBe(0);
    expect(provider.rewindAmountShieldedOutput).toHaveBeenCalledTimes(5);
  });

  it('records an entry that fails to rewind and stops trying it', async () => {
    const provider = fakeProvider();
    provider.rewindAmountShieldedOutput.mockRejectedValue(new Error('invalid point'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const found = await rewindSlots({ provider, key: SCAN_KEY, slots, fromIndex: 0, toIndex: 3 });
    warn.mockRestore();
    expect(found.get('output:0')).toEqual({ error: 'invalid point' });
    expect(provider.rewindAmountShieldedOutput).toHaveBeenCalledTimes(1);
  });

  it('returns null when cancelled', async () => {
    let cancelled = false;
    const found = await rewindSlots({
      provider: fakeProvider({ ownKey: childPrivkey(9) }),
      key: SCAN_KEY,
      slots,
      fromIndex: 0,
      toIndex: 20,
      onProgress: done => {
        if (done === 2) cancelled = true;
      },
      isCancelled: () => cancelled,
    });
    expect(found).toBe(null);
  });
});
