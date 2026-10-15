/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import { HDPrivateKey } from 'bitcore-lib';

/**
 * Wire value of a FullShielded output's `mode` (wallet-lib's
 * `ShieldedOutputMode.FULLY_SHIELDED`). AmountShielded is 1.
 */
export const FULL_SHIELDED_MODE = 2;

/**
 * How many addresses one search covers: wallet-lib's default gap limit.
 */
export const ADDRESS_BATCH_SIZE = 20;

// The scan key is the xpriv at m/44'/280'/1'/0; each shielded address uses
// its child at the address index.
const SCAN_KEY_DEPTH = 4;

const NATIVE_TOKEN_UID = '00';

/**
 * Parse the scan key a user pasted.
 *
 * @param {string} input The scan xpriv
 * @param {number} expectedVersion xpriv version bytes of the explorer's network
 *
 * @return {{ key: HDPrivateKey } | { error: string }}
 */
export function parseScanXPrivKey(input, expectedVersion) {
  const xpriv = typeof input === 'string' ? input.trim() : '';
  if (!xpriv) {
    return { error: 'paste your scan key' };
  }
  let key;
  try {
    key = new HDPrivateKey(xpriv);
  } catch {
    return { error: 'this is not a valid extended private key (xpriv)' };
  }
  if (key.xprivkey !== xpriv) {
    return { error: 'this is not a valid extended private key (xpriv)' };
  }
  if (key.network.xprivkey !== expectedVersion) {
    return { error: 'this key is for another network' };
  }
  if (key.depth !== SCAN_KEY_DEPTH) {
    return { error: "this is not a scan key: expected the key at m/44'/280'/1'/0" };
  }
  return { key };
}

/**
 * Rewind one shielded output (or shielded input) with an address's scan
 * private key, then check that the recovered values open its commitments.
 *
 * @param {Object} provider Crypto provider from `loadShieldedCryptoProvider`
 * @param {Buffer} privkey Scan private key of one address
 * @param {{ entry: Object, tokenUid?: string }} slot The shielded entry from the
 * tx API, and the token of an AmountShielded entry ('00' for the native token)
 *
 * @return {Promise<{ value: bigint, tokenUid: string } | null>} null when the
 * entry wasn't paid to this address
 */
export async function rewindSlot(provider, privkey, slot) {
  const { entry } = slot;
  const isFullShielded = entry.mode === FULL_SHIELDED_MODE;
  const ephemeralPubkey = Buffer.from(entry.ephemeral_pubkey, 'hex');
  const commitment = Buffer.from(entry.commitment, 'hex');
  const rangeProof = Buffer.from(entry.range_proof, 'base64');

  let rewound;
  let tokenUid;
  try {
    if (isFullShielded) {
      rewound = await provider.rewindFullShieldedOutput(
        privkey,
        ephemeralPubkey,
        commitment,
        rangeProof,
        Buffer.from(entry.asset_commitment, 'hex')
      );
      tokenUid = rewound.tokenUid.toLowerCase();
    } else {
      tokenUid = slot.tokenUid;
      rewound = await provider.rewindAmountShieldedOutput(
        privkey,
        ephemeralPubkey,
        commitment,
        rangeProof,
        Buffer.from(tokenUid.padStart(64, '0'), 'hex')
      );
    }
  } catch (e) {
    // A key that didn't receive this entry can't rewind its range proof.
    if (e?.name === 'ScanMissError') return null;
    throw e;
  }

  try {
    const tokenBuf = Buffer.from(tokenUid.padStart(64, '0'), 'hex');
    if (isFullShielded) {
      const opened = await provider.openFullShieldedCommitment(
        rewound.value,
        rewound.blindingFactor,
        tokenBuf,
        rewound.assetBlindingFactor
      );
      if (
        opened.valueCommitment.toString('hex') !== entry.commitment.toLowerCase() ||
        opened.assetCommitment.toString('hex') !== entry.asset_commitment.toLowerCase()
      ) {
        throw new Error('the rewound values do not open the commitments');
      }
    } else {
      const opened = await provider.openAmountShieldedCommitment(
        rewound.value,
        rewound.blindingFactor,
        tokenBuf
      );
      if (opened.toString('hex') !== entry.commitment.toLowerCase()) {
        throw new Error('the rewound values do not open the commitment');
      }
    }
    if (rewound.value <= 0n) {
      throw new Error('the rewound amount is not positive');
    }
  } finally {
    rewound.blindingFactor?.fill(0);
    rewound.assetBlindingFactor?.fill(0);
  }

  return {
    value: rewound.value,
    tokenUid: /^0+$/.test(tokenUid) ? NATIVE_TOKEN_UID : tokenUid,
  };
}

/**
 * Look for entries paid to the addresses `fromIndex` to `toIndex - 1` of a
 * scan key. Each address's child key is tried on every entry not found yet.
 *
 * @param {Object} params
 * @param {Object} params.provider Crypto provider
 * @param {HDPrivateKey} params.key Scan key from `parseScanXPrivKey`
 * @param {Array<{ id: string, entry: Object, tokenUid?: string }>} params.slots
 * Entries to look for, identified by `id`
 * @param {number} params.fromIndex First address index to try
 * @param {number} params.toIndex Address index to stop before
 * @param {function(number): void} [params.onProgress] Called with the number of
 * addresses tried so far
 * @param {function(): boolean} [params.isCancelled] Stops the search when true
 *
 * @return {Promise<Map<string, Object> | null>} Found entries by id, as
 * `{ value, tokenUid, addressIndex }` or `{ error }`; null if cancelled
 */
export async function rewindSlots({
  provider,
  key,
  slots,
  fromIndex,
  toIndex,
  onProgress,
  isCancelled = () => false,
}) {
  const found = new Map();
  let pending = slots;
  for (let index = fromIndex; index < toIndex && pending.length > 0; index++) {
    const privkey = key.deriveChild(index).privateKey.toBuffer({ size: 32 });
    try {
      const stillPending = [];
      for (const slot of pending) {
        if (isCancelled()) return null;
        try {
          const result = await rewindSlot(provider, privkey, slot);
          if (result) {
            found.set(slot.id, { ...result, addressIndex: index });
          } else {
            stillPending.push(slot);
          }
        } catch (e) {
          console.warn(`[shielded] could not rewind ${slot.id}:`, e?.message ?? e);
          found.set(slot.id, { error: e?.message ?? String(e) });
        }
      }
      pending = stillPending;
    } finally {
      privkey.fill(0);
    }
    if (onProgress) onProgress(index + 1 - fromIndex);
  }
  return isCancelled() ? null : found;
}
