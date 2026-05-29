/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Boot-time wiring for the browser-side shielded crypto provider.
 *
 * The explorer doesn't sign or scan; it only verifies user-supplied
 * unblinding payloads against on-chain commitments (in the "view tx
 * unblinded" flow). For that it needs a verifier-only
 * `IShieldedCryptoProvider` that runs in the browser — provided by
 * `@hathor/ct-crypto-wasm/provider` (the adapter ships in the same
 * package as the WASM bindings, since the migration to the
 * hathor-ct-crypto monorepo).
 *
 * If the WASM package isn't installed yet the call resolves silently and
 * any code path that tries to verify renders an "unverifiable" state
 * (treating shared values as claimed) — better than crashing the whole
 * tx detail page on a missing optional dependency. Install the package
 * + restart the dev server to activate verification.
 */
export async function setupShieldedCrypto() {
  let provider;
  try {
    // Dynamic import keeps the optional dependency truly optional: if
    // @hathor/ct-crypto-wasm isn't installed, the import rejects and we
    // gracefully degrade below.
    const { createBrowserShieldedCryptoProvider } = await import('@hathor/ct-crypto-wasm/provider');
    provider = await createBrowserShieldedCryptoProvider();
  } catch (err) {
    // Package not installed (`Cannot find module …`) or WASM init failed
    // (e.g. browser refused fetch of the .wasm). Either way, leave the
    // provider unset — verification paths gracefully degrade.
    /* eslint-disable-next-line no-console */
    console.warn(
      '[setupShieldedCrypto] browser shielded provider unavailable — ' +
        'verification of unblinding payloads disabled. ' +
        'Install @hathor/ct-crypto-wasm to enable.',
      err && err.message ? err.message : err
    );
    return null;
  }

  // The explorer doesn't keep its own wallet-lib storage — exposing the
  // provider as a module export so the verify utility can reach it
  // directly is the simplest path that doesn't require explorer code
  // to spin up a fake `Storage`.
  // eslint-disable-next-line no-use-before-define
  cachedProvider = provider;
  return provider;
}

let cachedProvider = null;

/**
 * Synchronous accessor for the registered provider. Returns `null`
 * when the WASM package isn't installed or hasn't finished loading.
 */
export function getShieldedCryptoProvider() {
  return cachedProvider;
}
