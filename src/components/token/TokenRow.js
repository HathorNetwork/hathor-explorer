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
import { useIsMobile, useNewUiEnabled } from '../../hooks';

function TokenRow({ token }) {
  const history = useHistory();
  const newUiEnabled = useNewUiEnabled();
  const isMobile = useIsMobile();

  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  const onRowClicked = uid => {
    history.push(`/token_detail/${uid}`);
  };

  const Symbol = ({ children }) => {
    return <div className="table-tokens-symbol">{children}</div>;
  };

  const renderIdCell = id => {
    const idStart = id.substring(0, isMobile ? 4 : 12);
    const idEnd = id.substring(id.length - (isMobile ? 4 : 12), id.length);

    return (
      <div className="id-cell">
        {idStart}
        <div className="ellipsis">
          <div className="ellipsi"></div>
          <div className="ellipsi"></div>
          <div className="ellipsi"></div>
        </div>
        {idEnd}
      </div>
    );
  };

  const renderNewUi = () =>
    isMobile ? (
      <tr onClick={_e => onRowClicked(token.uid)}>
        <td className="d-lg-table-cell pe-3">{renderIdCell(token.uid)}</td>
        <td className="d-lg-table-cell pe-3">{token.name}</td>
      </tr>
    ) : (
      <tr onClick={_e => onRowClicked(token.uid)}>
        <td className="d-lg-table-cell pe-3">{renderIdCell(token.uid)}</td>
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

  const renderUi = () => (
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

  return newUiEnabled ? renderNewUi() : renderUi();
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
