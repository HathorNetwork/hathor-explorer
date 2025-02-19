/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { numberUtils } from '@hathor/wallet-lib';
import { useSelector } from 'react-redux';
import { useIsMobile, useNewUiEnabled } from '../../hooks';
import EllipsiCell from '../EllipsiCell';

function TokenBalanceRow({ tokenId, address, total, unlocked, locked }) {
  const navigate = useNavigate();
  const newUiEnabled = useNewUiEnabled();
  const isMobile = useIsMobile();
  const decimalPlaces = useSelector(state => state.serverInfo.decimal_places);

  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  const onRowClicked = () => {
    navigate(`/address/${address}?token=${tokenId}`);
  };

  const renderUi = () => (
    <tr onClick={onRowClicked}>
      <td className="d-lg-table-cell pe-3">{address}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(total, decimalPlaces)}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(unlocked, decimalPlaces)}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(locked, decimalPlaces)}</td>
    </tr>
  );

  const renderNewUi = () => (
    <tr onClick={onRowClicked}>
      <td className="d-lg-table-cell pe-3">{isMobile ? <EllipsiCell id={address} /> : address}</td>
      <td className="d-lg-table-cell pe-3">{numberUtils.prettyValue(total, decimalPlaces)}</td>
      <td className="d-lg-table-cell pe-3 td-mobile">
        {numberUtils.prettyValue(unlocked, decimalPlaces)}
      </td>
      <td className="d-lg-table-cell pe-3 td-mobile">
        {numberUtils.prettyValue(locked, decimalPlaces)}
      </td>
    </tr>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
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
