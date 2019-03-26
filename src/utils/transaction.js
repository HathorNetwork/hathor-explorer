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