/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let providerPromise = null;

/**
 * Load the browser crypto provider that verifies unblinding payloads.
 *
 * The explorer never signs or scans; it only recomputes commitments, which
 * `@hathor/ct-crypto-wasm/provider` does in the browser. The package and its
 * WASM (about 1.25 MB gzipped) are only needed on a transaction page with a
 * payload, so they are imported on the first call instead of at startup.
 *
 * @return {Promise<Object|null>} The provider, or null if it couldn't load.
 * The result is cached, including a failure.
 */
export function loadShieldedCryptoProvider() {
  if (!providerPromise) {
    providerPromise = import('@hathor/ct-crypto-wasm/provider')
      .then(({ createBrowserShieldedCryptoProvider }) => createBrowserShieldedCryptoProvider())
      .catch(err => {
        console.warn(
          '[shielded] could not load the crypto provider; unblinding payloads cannot be verified.',
          err?.message ?? err
        );
        return null;
      });
  }
  return providerPromise;
}
