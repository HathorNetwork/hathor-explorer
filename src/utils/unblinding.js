/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import { AMOUNT_SHIELDED_MODE, FULL_SHIELDED_MODE } from './shieldedRewind';

/**
 * Upper bound for a payload, in characters. A transaction has at most
 * 255 inputs and 32 shielded outputs, and one entry encodes to about
 * 350 base64url characters, so a real payload stays well below this.
 */
export const MAX_UNBLINDING_PAYLOAD_LENGTH = 128 * 1024;

const MAX_AMOUNT = 1n << 64n;
const HEX_32_BYTES = /^[0-9a-f]{64}$/;
const HEX = /^(?:[0-9a-f]{2})+$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * Validate one `{ index, value, token, vbf, abf? }` entry, as written by
 * wallet-lib's `shielded.encodeShieldedUnblindingPayload`.
 *
 * @return {{ entry: Object } | { error: string }}
 */
function parseEntry(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'payload contains a malformed entry' };
  }
  const { index, value, token, vbf, abf } = raw;
  if (!Number.isInteger(index) || index < 0) {
    return { error: 'payload contains an entry with an invalid index' };
  }
  if (typeof value !== 'string' || !DECIMAL.test(value) || BigInt(value) >= MAX_AMOUNT) {
    return { error: `entry ${index}: amount must be a non-negative integer below 2^64` };
  }
  // The wallet writes HTR as '00' and any other token as its 32-byte uid.
  if (typeof token !== 'string' || (token !== '00' && !HEX_32_BYTES.test(token.toLowerCase()))) {
    return { error: `entry ${index}: token must be '00' or a 32-byte hex uid` };
  }
  if (typeof vbf !== 'string' || !HEX_32_BYTES.test(vbf.toLowerCase())) {
    return { error: `entry ${index}: value blinding factor must be 32 bytes of hex` };
  }
  if (abf !== undefined && (typeof abf !== 'string' || !HEX_32_BYTES.test(abf.toLowerCase()))) {
    return { error: `entry ${index}: asset blinding factor must be 32 bytes of hex` };
  }
  return {
    entry: {
      index,
      value: BigInt(value),
      token: token.toLowerCase(),
      vbf: vbf.toLowerCase(),
      abf: abf?.toLowerCase(),
    },
  };
}

/**
 * Validate a list of entries and index them, refusing duplicates.
 *
 * @return {{ map: Map<number, Object> } | { error: string }}
 */
function parseEntries(list) {
  const map = new Map();
  for (const raw of list) {
    const result = parseEntry(raw);
    if (result.error) return result;
    if (map.has(result.entry.index)) {
      return { error: `payload lists index ${result.entry.index} twice` };
    }
    map.set(result.entry.index, result.entry);
  }
  return { map };
}

/**
 * Decode and validate the unblinding payload of a wallet's
 * "View in Explorer unblinded" link, as built by wallet-lib's
 * `shielded.encodeShieldedUnblindingPayload`:
 *
 *   base64url(JSON.stringify({ v: 1, txId, outputs: [...], inputs?: [...] }))
 *
 * Outputs are keyed by their on-chain index (the number of transparent
 * outputs plus the position in `shielded_outputs`), inputs by their
 * position in the transaction's `inputs`.
 *
 * Accepts the bare payload or a URL carrying `unblind=<payload>`.
 *
 * @param {string} rawInput Payload, or a URL that contains it
 * @param {string} [expectedTxId] Hash of the transaction on screen
 *
 * @return {{ outputs: Map<number, Object>, inputs: Map<number, Object> } | { error: string }}
 * Never throws: anything unexpected in a crafted payload is an error too.
 */
export function parseUnblindingPayload(rawInput, expectedTxId) {
  try {
    return parsePayload(rawInput, expectedTxId);
  } catch {
    return { error: 'payload could not be read' };
  }
}

function parsePayload(rawInput, expectedTxId) {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return { error: 'empty payload' };
  }

  let blob = rawInput.trim();
  const marker = 'unblind=';
  const markerIdx = blob.lastIndexOf(marker);
  if (markerIdx >= 0) {
    // Drop anything after the payload, e.g. a following `&section=…`.
    [blob] = blob.slice(markerIdx + marker.length).split('&');
  }

  if (blob.length > MAX_UNBLINDING_PAYLOAD_LENGTH) {
    return { error: 'payload is too long' };
  }
  if (!BASE64URL.test(blob)) {
    return { error: 'payload is not valid base64url' };
  }

  // The `buffer` polyfill has no 'base64url' encoding, so map it to base64.
  const base64 = blob.replace(/-/g, '+').replace(/_/g, '/');

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return { error: 'payload is not valid JSON' };
  }

  if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) {
    // Never echo the payload's own text: it comes from whoever made the link.
    const got = Number.isInteger(parsed?.v) ? ` (got ${parsed.v})` : '';
    return { error: `unsupported unblinding payload version${got}` };
  }
  if (typeof parsed.txId !== 'string' || !HEX_32_BYTES.test(parsed.txId.toLowerCase())) {
    return { error: 'payload has no valid txId' };
  }
  if (expectedTxId && parsed.txId.toLowerCase() !== expectedTxId.toLowerCase()) {
    return { error: `payload is for a different tx (${parsed.txId.slice(0, 12)}…)` };
  }
  if (!Array.isArray(parsed.outputs)) {
    return { error: 'payload has no outputs list' };
  }
  if (parsed.inputs !== undefined && !Array.isArray(parsed.inputs)) {
    return { error: 'payload inputs must be a list' };
  }

  const outputs = parseEntries(parsed.outputs);
  if (outputs.error) return { error: outputs.error };
  const inputs = parseEntries(parsed.inputs ?? []);
  if (inputs.error) return { error: inputs.error };

  return { outputs: outputs.map, inputs: inputs.map };
}

/**
 * Check a parsed entry against the shielded output (or shielded input)
 * it claims to open, by recomputing the commitments with the provider.
 * Only a verified entry may be shown.
 *
 * Returns one of:
 *   - { state: 'verified', value, tokenUid }
 *   - { state: 'mismatch', reason }  // the opening doesn't match the chain
 *   - { state: 'error', reason }     // the chain data or the provider failed
 *
 * @param {Object} entry Entry from `parseUnblindingPayload`
 * @param {Object} onChainOutput Shielded output (or input) from the tx API
 * @param {Object} provider Crypto provider from `loadShieldedCryptoProvider`
 */
export async function verifyUnblindingEntry(entry, onChainOutput, provider) {
  const { value, token: tokenUid } = entry;
  if (onChainOutput.mode !== AMOUNT_SHIELDED_MODE && onChainOutput.mode !== FULL_SHIELDED_MODE) {
    return { state: 'error', reason: `unknown shielded mode ${onChainOutput.mode}` };
  }

  const isFullShielded = onChainOutput.mode === FULL_SHIELDED_MODE;
  if (isFullShielded !== (entry.abf !== undefined)) {
    return {
      state: 'mismatch',
      reason: isFullShielded
        ? 'missing the asset blinding factor of a fully shielded output'
        : 'has an asset blinding factor, but the amount-shielded output has none',
    };
  }

  const commitmentHex = (onChainOutput.commitment || '').toLowerCase();
  const assetCommitmentHex = (onChainOutput.asset_commitment || '').toLowerCase();
  if (!HEX.test(commitmentHex) || (isFullShielded && !HEX.test(assetCommitmentHex))) {
    return { state: 'error', reason: 'on-chain commitment is not valid hex' };
  }

  const vbf = Buffer.from(entry.vbf, 'hex');
  // HTR arrives as '00'; the commitment is derived from the 32-byte uid.
  const tokenBuf = Buffer.from(tokenUid.padStart(64, '0'), 'hex');

  try {
    if (isFullShielded) {
      const abf = Buffer.from(entry.abf, 'hex');
      const opened = await provider.openFullShieldedCommitment(value, vbf, tokenBuf, abf);
      if (
        opened.valueCommitment.toString('hex') !== commitmentHex ||
        opened.assetCommitment.toString('hex') !== assetCommitmentHex
      ) {
        return { state: 'mismatch', reason: 'commitment mismatch' };
      }
    } else {
      const opened = await provider.openAmountShieldedCommitment(value, vbf, tokenBuf);
      if (opened.toString('hex') !== commitmentHex) {
        return { state: 'mismatch', reason: 'commitment mismatch' };
      }
    }
  } catch (e) {
    return { state: 'error', reason: e?.message ?? 'unexpected verification error' };
  }

  return { state: 'verified', value, tokenUid };
}

/**
 * Remove `unblind=<payload>` from a URL fragment, keeping its other
 * parameters (e.g. `section=`).
 *
 * @param {string} hash `location.hash`, with or without the leading '#'
 * @return {string} The remaining fragment, without the leading '#'
 */
export function stripUnblindFromHash(hash) {
  const params = new URLSearchParams((hash || '').replace(/^#/, ''));
  params.delete('unblind');
  return params.toString();
}
