/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Buffer } from 'buffer';
import { getShieldedCryptoProvider } from '../setupShieldedCrypto';

/**
 * Decode + validate the unblinding payload shared by the wallet for
 * "view tx unblinded". Both the URL fragment (`#unblind=…`) and the
 * paste-panel input flow through this single parser, so the schema
 * checks live in exactly one place.
 *
 * Returns `{ outputs: Map<onChainIndex, entry> }` on success, or
 * `{ error }` on any validation failure. The caller decides how to
 * surface errors (silently ignore for fragment, show a friendly message
 * for paste).
 */
export function parseUnblindingPayload(rawInput, expectedTxId) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { error: 'empty payload' };
  }

  // Allow callers to paste a full URL like
  // "https://explorer/transaction/abc#unblind=…" — strip everything up
  // to and including `unblind=` so the same parser works for both
  // delivery channels.
  let blob = rawInput.trim();
  const marker = 'unblind=';
  const markerIdx = blob.lastIndexOf(marker);
  if (markerIdx >= 0) {
    blob = blob.slice(markerIdx + marker.length);
  }

  // base64url → standard base64 → utf-8 string. Padding is permissive:
  // wallets emit unpadded base64url; we add `=` back if needed so
  // older base64 decoders that demand padding don't reject it.
  const padded = blob.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));

  let json;
  try {
    json = Buffer.from(padded + padding, 'base64').toString('utf8');
  } catch {
    return { error: 'payload is not valid base64url' };
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: 'payload is not valid JSON' };
  }

  if (!parsed || parsed.v !== 1) {
    return { error: `unsupported unblinding payload version (got ${parsed?.v})` };
  }
  if (typeof parsed.txId !== 'string') {
    return { error: 'payload missing txId' };
  }
  if (expectedTxId && parsed.txId !== expectedTxId) {
    return {
      error: `payload is for a different tx (${parsed.txId.slice(0, 12)}…)`,
    };
  }
  if (!Array.isArray(parsed.outputs)) {
    return { error: 'payload missing outputs[]' };
  }

  // Same validator for outputs and inputs — schema is identical, only
  // the keying differs (outputs by on-chain absolute index, inputs by
  // position within the current tx's `inputs[]`).
  const validateAndCollect = entries => {
    const map = new Map();
    for (const e of entries) {
      if (
        !e ||
        typeof e.index !== 'number' ||
        !Number.isInteger(e.index) ||
        e.index < 0 ||
        typeof e.value !== 'string' ||
        typeof e.token !== 'string' ||
        typeof e.vbf !== 'string' ||
        (e.abf !== undefined && typeof e.abf !== 'string')
      ) {
        return { error: 'payload contains a malformed entry' };
      }
      map.set(e.index, {
        index: e.index,
        // Defer BigInt parse until we actually use the value — keeps
        // failure surface narrow if a wallet ever ships a non-numeric
        // string by accident.
        value: e.value,
        token: e.token,
        vbf: e.vbf,
        abf: e.abf,
      });
    }
    return { map };
  };

  const outputsResult = validateAndCollect(parsed.outputs);
  if (outputsResult.error) return { error: outputsResult.error };

  // `inputs` is optional — older payloads (pre-v1.1 wallet) only carry
  // outputs. Treat absence as "no input unblindings provided".
  let inputsMap = new Map();
  if (parsed.inputs !== undefined) {
    if (!Array.isArray(parsed.inputs)) {
      return { error: 'payload `inputs` must be an array if present' };
    }
    const inputsResult = validateAndCollect(parsed.inputs);
    if (inputsResult.error) return { error: inputsResult.error };
    inputsMap = inputsResult.map;
  }

  return { outputs: outputsResult.map, inputs: inputsMap };
}

/**
 * Verify a single parsed unblinding entry against an on-chain shielded
 * output. Returns one of:
 *   - { state: 'verified', value, tokenUid }
 *   - { state: 'mismatch', reason }      // commitment didn't match
 *   - { state: 'unverified', value, tokenUid }   // no provider loaded
 *   - { state: 'error', reason }         // schema or crypto error
 *
 * Verification is async because the Pedersen-recompute primitives in
 * the WASM provider are async. Outputs without a corresponding entry
 * stay opaque (the caller renders the existing ConfidentialBadge).
 */
export async function verifyUnblindingEntry(entry, onChainOutput) {
  const provider = getShieldedCryptoProvider();
  let value;
  try {
    value = BigInt(entry.value);
  } catch {
    return { state: 'error', reason: 'value is not a valid integer' };
  }
  const tokenUid = entry.token;

  // Without a provider the explorer can't verify cryptographically; we
  // pass the values through with a clear "unverified" state so the UI
  // can warn. This is the correct fallback when the user hasn't installed
  // @hathor/ct-crypto-wasm yet — it doesn't pretend the share is valid.
  if (!provider) {
    return { state: 'unverified', value, tokenUid };
  }

  let vbf;
  let abf;
  try {
    vbf = Buffer.from(entry.vbf, 'hex');
    abf = entry.abf ? Buffer.from(entry.abf, 'hex') : undefined;
  } catch {
    return { state: 'error', reason: 'blinding factor is not valid hex' };
  }
  if (vbf.length !== 32) {
    return { state: 'error', reason: 'vbf must be 32 bytes' };
  }
  if (abf !== undefined && abf.length !== 32) {
    return { state: 'error', reason: 'abf must be 32 bytes' };
  }

  let onChainCommitment;
  let onChainAssetCommitment;
  try {
    onChainCommitment = Buffer.from(onChainOutput.commitment, 'hex');
    onChainAssetCommitment = onChainOutput.asset_commitment
      ? Buffer.from(onChainOutput.asset_commitment, 'hex')
      : undefined;
  } catch {
    return { state: 'error', reason: 'on-chain commitment is not valid hex' };
  }

  const tokenBuf = Buffer.from(tokenUid.padStart(64, '0'), 'hex');
  if (tokenBuf.length !== 32) {
    return { state: 'error', reason: 'token must encode to 32 bytes' };
  }

  try {
    if (abf !== undefined) {
      // FullShielded: verify both value AND asset commitments match.
      const recomputed = await provider.openFullShieldedCommitment(value, vbf, tokenBuf, abf);
      if (
        !recomputed.valueCommitment.equals(onChainCommitment) ||
        !onChainAssetCommitment ||
        !recomputed.assetCommitment.equals(onChainAssetCommitment)
      ) {
        return { state: 'mismatch', reason: 'commitment mismatch' };
      }
    } else {
      const recomputed = await provider.openAmountShieldedCommitment(value, vbf, tokenBuf);
      if (!recomputed.equals(onChainCommitment)) {
        return { state: 'mismatch', reason: 'commitment mismatch' };
      }
    }
  } catch (e) {
    return {
      state: 'error',
      reason: e?.message ?? 'unexpected verification error',
    };
  }

  return { state: 'verified', value, tokenUid };
}
