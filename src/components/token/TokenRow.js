/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import dateFormatter from '../../utils/date';
import { useIsMobile } from '../../hooks';
import EllipsiCell from '../EllipsiCell';

function TokenRow({ token }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  const onRowClicked = uid => {
    navigate(`/token_detail/${uid}`);
  };

  const Symbol = ({ children }) => {
    return <div className="table-tokens-symbol">{children}</div>;
  };

  const renderNewUi = () =>
    isMobile ? (
      <tr onClick={_e => onRowClicked(token.uid)}>
        <td className="d-lg-table-cell pe-3">
          <EllipsiCell id={token.uid} countBefore={4} countAfter={4} />
        </td>
        <td className="d-lg-table-cell pe-3">{token.name}</td>
      </tr>
    ) : (
      <tr onClick={_e => onRowClicked(token.uid)}>
        <td className="d-lg-table-cell pe-3">
          <EllipsiCell id={token.uid} countBefore={12} countAfter={12} />
        </td>
        <td className="d-lg-table-cell pe-3">{token.name}</td>
        <td className="d-lg-table-cell pe-3">
          <Symbol>{token.symbol}</Symbol>
        </td>
        <td className="d-lg-table-cell pe-3">{token.nft ? 'NFT' : 'Custom Token'}</td>
        <td className="d-lg-table-cell pe-3 date-cell">
          {dateFormatter.parseTimestampNewUi(token.transaction_timestamp)}
        </td>
      </tr>
    );

  return renderNewUi();
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
