/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import { HDPrivateKey } from 'bitcore-lib';

/**
 * Wire values of a shielded entry's `mode` (wallet-lib's
 * `ShieldedOutputMode`). Any other value is a mode this explorer doesn't
 * know: such an entry is shown as plain "Confidential" and never rewound.
 */
export const AMOUNT_SHIELDED_MODE = 1;
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
 * Any network prefix is accepted: the prefix doesn't change the derived
 * keys, and wallets export the scan key as `xprv…` on every network (seed
 * wallets) or `htpr…` (passkey wallets).
 *
 * @param {string} input The scan xpriv
 *
 * @return {{ key: HDPrivateKey } | { error: string }}
 */
export function parseScanXPrivKey(input) {
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
  // Only the depth can be checked: a key at another path of the same depth
  // is accepted, and simply opens nothing.
  if (key.depth !== SCAN_KEY_DEPTH) {
    return { error: 'this is not a scan key: expected an extended key of depth 4' };
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
 * entry's range proof wasn't encrypted to this key. Opening an entry doesn't
 * prove it pays the key's owner: the entry's script is independent of it.
 */
export async function rewindSlot(provider, privkey, slot) {
  const { entry } = slot;
  if (entry.mode !== AMOUNT_SHIELDED_MODE && entry.mode !== FULL_SHIELDED_MODE) {
    throw new Error(`unknown shielded mode ${entry.mode}`);
  }
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
 * Let the browser paint and handle input. The WASM rewind runs on the main
 * thread and its promises resolve right away, so without this a batch would
 * run as one long task: the page would freeze and the progress never paint.
 */
const yieldToBrowser = () =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Look for entries that open with the keys of addresses `fromIndex` to
 * `toIndex - 1` of a scan key. Each address's child key is tried on every
 * entry not found yet.
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
 * @return {Promise<Map<string, Object> | null>} Results by id, as
 * `{ state: 'verified', value, tokenUid, addressIndex }` or
 * `{ state: 'error', reason }`; null if cancelled
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
        await yieldToBrowser();
        if (isCancelled()) return null;
        try {
          const result = await rewindSlot(provider, privkey, slot);
          if (result) {
            found.set(slot.id, { state: 'verified', ...result, addressIndex: index });
          } else {
            stillPending.push(slot);
          }
        } catch (e) {
          console.warn(`[shielded] could not rewind ${slot.id}:`, e?.message ?? e);
          found.set(slot.id, {
            state: 'error',
            reason: e?.message || String(e) || 'unknown error',
          });
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
