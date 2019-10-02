/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TOKEN_AUTHORITY_MASK } from '../constants';

/**
 * @namespace Transaction
 */

const transaction = {
  /*
   * Verifies if output is an authority one checking with authority mask
   *
   * @param {Object} output Output object with 'token_data' key
   *
   * @return {boolean} if output is authority
   *
   * @memberof Wallet
   * @inner
   */
  isAuthorityOutput(output) {
    return (output.token_data & TOKEN_AUTHORITY_MASK) > 0
  },
}

export default transaction;