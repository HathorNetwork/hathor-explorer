/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import dateFormatter from '../../utils/date';

function TokenRow({ token }) {
  const history = useHistory();
  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  const onRowClicked = uid => {
    history.push(`/token_detail/${uid}`);
  };

  return (
    <tr onClick={_e => onRowClicked(token.uid)}>
      <td className="d-lg-table-cell pe-3">{hathorLib.helpersUtils.getShortHash(token.uid)}</td>
      <td className="d-lg-table-cell pe-3">{token.name}</td>
      <td className="d-lg-table-cell pe-3">{token.symbol}</td>
      <td className="d-lg-table-cell pe-3">{token.nft ? 'NFT' : 'Custom Token'}</td>
      <td className="d-lg-table-cell pe-3">
        {dateFormatter.parseTimestamp(token.transaction_timestamp)}
      </td>
    </tr>
  );
}

/**
 * uid: Token UID
 * name: Token name
 * symbol: Token symbol
 * nft: If token is NFT or a Custom Token
 * transaction_timestamp: Timestamp of the transaction that created the token
 */
TokenRow.propTypes = {
  token: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    nft: PropTypes.bool.isRequired,
    transaction_timestamp: PropTypes.number.isRequired,
  }),
};

export default TokenRow;
