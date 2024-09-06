/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { numberUtils } from '@hathor/wallet-lib';
import { useSelector } from 'react-redux';

function TokenBalanceRow({ tokenId, address, total, unlocked, locked }) {
  const history = useHistory();

  const { decimalPlaces } = useSelector(state => ({
    decimalPlaces: state.serverInfo.decimal_places,
  }));

  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  const onRowClicked = () => {
    history.push(`/address/${address}?token=${tokenId}`);
  };

  return (
    <tr onClick={_e => onRowClicked(address)}>
      <td className="d-lg-table-cell pe-3">{address}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(total, decimalPlaces)}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(unlocked, decimalPlaces)}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(locked, decimalPlaces)}</td>
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
TokenBalanceRow.propTypes = {
  address: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  unlocked: PropTypes.number.isRequired,
  locked: PropTypes.number.isRequired,
  tokenId: PropTypes.string.isRequired,
};

export default TokenBalanceRow;
