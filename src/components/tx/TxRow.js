/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useHistory } from 'react-router-dom';
import hathorLib from '@hathor/wallet-lib';
import dateFormatter from '../../utils/date';
import { useIsMobile, useNewUiEnabled } from '../../hooks';

const TxRow = ({ tx, ellipsis }) => {
  const newUiEnabled = useNewUiEnabled();
  const isMobile = useIsMobile();
  const history = useHistory();

  const handleClickTr = hash => {
    history.push(`/transaction/${hash}`);
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

  const renderNewUi = () => (
    <tr onClick={_e => handleClickTr(tx.tx_id)}>
      <td className=" d-lg-table-cell pe-3">{ellipsis ? renderIdCell(tx.tx_id) : tx.tx_id}</td>
      <td className=" d-lg-table-cell pe-3 date-cell">
        {dateFormatter.parseTimestampNewUi(tx.timestamp)}
      </td>
    </tr>
  );

  const renderUi = () => (
    <tr onClick={_e => handleClickTr(tx.tx_id)}>
      <td className="d-none d-lg-table-cell pe-3">{tx.tx_id}</td>
      <td className="d-none d-lg-table-cell pe-3">{dateFormatter.parseTimestamp(tx.timestamp)}</td>
      <td className="d-lg-none d-table-cell pe-3" colSpan="2">
        {hathorLib.helpersUtils.getShortHash(tx.tx_id)} {dateFormatter.parseTimestamp(tx.timestamp)}
      </td>
    </tr>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default TxRow;
