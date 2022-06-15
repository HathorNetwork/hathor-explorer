/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import hathorLib from '@hathor/wallet-lib';
import { MAINNET_GENESIS_BLOCK, TESTNET_GENESIS_BLOCK, MAINNET_GENESIS_TX, TESTNET_GENESIS_TX, DECIMAL_PLACES, MIN_API_VERSION } from '../constants';
import { get } from 'lodash';

const helpers = {
  updateListWs(list, newEl, max) {
    // We remove the last element if we already have the max
    if (list.length === max) {
      list.pop();
    }
    // Then we add the new on in the first position
    list.splice(0, 0, newEl);
    return list;
  },

  getTxType(tx) {
    if (this.isGenesisTx(tx.hash)) {
      return 'Tx';
    } else if (this.isGenesisBlock(tx.hash)) {
      return 'Block';
    } else {
      if (tx.inputs.length > 0) {
        return 'Tx';
      } else {
        return 'Block';
      }
    }
  },

  isBlock(tx) {
    return this.getTxType(tx) === 'Block';
  },

  roundFloat(n) {
    return Math.round(n*100)/100
  },

  prettyValue(value) {
    return (value/10**DECIMAL_PLACES).toFixed(DECIMAL_PLACES);
  },

  isVersionAllowed(version) {
    // Verifies if the version in parameter is allowed to make requests to the API backend
    // We check with our min api version
    if (version.includes('beta') !== MIN_API_VERSION.includes('beta')) {
      // If one version is beta and the other is not, it's not allowed to use it
      return false;
    }

    // Clean the version string to have an array of integers
    // Check for each value if the version is allowed
    let versionTestArr = this.getCleanVersionArray(version);
    let minVersionArr = this.getCleanVersionArray(MIN_API_VERSION);
    for (let i=0; i<minVersionArr.length; i++) {
      if (minVersionArr[i] > versionTestArr[i]) {
        return false;
      } else if (minVersionArr[i] < versionTestArr[i]) {
        return true;
      }
    }

    return true;
  },

  getCleanVersionArray(version) {
    return version.replace(/[^\d.]/g, '').split('.');
  },

  /*
   * Returns the right string depending on the quantity (plural or singular)
   *
   * @param {number} quantity Value considered to check plural or singular
   * @param {string} singular String to be returned in case of singular
   * @param {string} plural String to be returned in case of plural
   *
   * @return {string} plural or singular
   * @memberof Helpers
   * @inner
   *
   */
  plural(quantity, singular, plural) {
    if (quantity === 1) {
      return singular;
    } else {
      return plural;
    }
  },

  /**
   * Returns a string with the short version of the id of a transaction
   * Returns {first12Chars}...{last12Chars}
   *
   * @param {string} hash Transaction ID to be shortened
   *
   * @return {string}
   * @memberof Helpers
   * @inner
   *
   */
  getShortHash(hash) {
    return `${hash.substring(0,12)}...${hash.substring(52,64)}`;
  },

  /**
   * Returns the prefixes for truncated values
   *
   * If the value was divided by 1024 one time, returns 'K',
   * in case of two divisions, 'M', for 3 divisions, 'G' and so on.
   *
   * @param {number} divisions Number of times the value was divided by 1024
   *
   * @return {string} Prefix to be used
   * @memberof Helpers
   * @inner
   */
  getUnitPrefix(divisions) {
    const unitMap = {
      0: '',
      1: 'K',
      2: 'M',
      3: 'G',
      4: 'T',
      5: 'P',
      6: 'E',
      7: 'Z',
      8: 'Y',
    }
    return unitMap[divisions];
  },

  /**
   * Divide a big value to be used with prefixes
   * The value is divided by 1000 while it can, which is the newest convention
   * for K, M, ... prefixes. Binary prefixes are now Ki, Mi, ...
   *
   * 3,000 = 3.00 after one division (K)
   * 50,000,000 = 50.00 after two divisions (M)
   *
   * @param {number} value Value to be divided
   *
   * @return {Object} Object with truncated value and number of divisions
   * @memberof Helpers
   * @inner
   */
  divideValueIntoPrefix(value) {
    let divisions = 0;
    while ((value / 1000) > 1) {
      value /= 1000;
      divisions += 1;
    }

    return {value: value.toFixed(2), divisions};
  },

  /**
   * Checks if transaction is a Genesis transaction
   *
   * @param {string} hash Hash of transaction
   *
   * @return {boolean} true if is genesis, false otherwise
   * @memberof Helpers
   * @inner
   */
  isGenesisTx(hash) {
    if (this.isMainnet()) {
      return MAINNET_GENESIS_TX.includes(hash);
    }

    return TESTNET_GENESIS_TX.includes(hash);
  },

  /**
   * Checks if block is Genesis
   *
   * @param {string} hash Hash of block
   *
   * @return {boolean} true if is genesis, false otherwise
   * @memberof Helpers
   * @inner
   */
  isGenesisBlock(hash) {
    if (this.isMainnet()) {
      return MAINNET_GENESIS_BLOCK.includes(hash);
    }

    return TESTNET_GENESIS_BLOCK.includes(hash);
  },

  /**
   * Checks if current network is mainnet
   *
   * @return {boolean} true if is mainnet, false otherwise
   * @memberof Helpers
   * @inner
   */
  isMainnet() {
    return hathorLib.network.getNetwork().name === 'mainnet';
  },

  /**
   * Get file extension
   *
   * @param {string} file File name
   *
   * @return {string} extension of the file
   * @memberof Helpers
   * @inner
   */
  getFileExtension(file) {
    const parts = file.split('.');
    if (parts.length === 1) {
      return '';
    }
    return parts[parts.length - 1];
  },

  /**
   * Render value to integer or decimal
   *
   * @param {number} amount Amount to render
   * @param {boolean} isInteger If it's an integer or decimal
   *
   * @return {string} rendered value
   * @memberof Helpers
   * @inner
   */
  renderValue(amount, isInteger) {
    if (isInteger) {
      return hathorLib.helpersUtils.prettyIntegerValue(amount);
    } else {
      return hathorLib.helpersUtils.prettyValue(amount);
    }
  },

  /**
   * Promisifies the instance's setState method
   *
   * @param {Object} The Component instance to promisify the setState method
   * @param {Object} The state to apply asyncronously
   *
   * @return {Promise} A promise that resolves when the state is applied
   * @memberof Helpers
   * @inner
   */
  async setStateAsync(instance, state) {
    return new Promise((resolve) => instance.setState(state, resolve));
  },

  /**
   * Parses the response from Explorer Service and add an object `error` to the respoonse.
   * This way, clients of this method do not have to handle status codes.
   * 
   * @param {Object} response 
   * @returns Explorer Service result enriched with the `error` object
   */
  handleExplorerServiceResponse(response) {
    // If status is not retrieved, we assume an internal error ocurred, giving the status code 500
    // Currently 200 is always returned for success responses
    if (get(response, 'status', 500) > 299) {
      return {
        'error': true,
      };
    }

    return {
      ...response,
      error: false,
    };
  }
}

export default helpers;
