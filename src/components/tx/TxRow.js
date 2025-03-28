/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import dateFormatter from '../../utils/date';
import { useIsMobile } from '../../hooks';
import EllipsiCell from '../EllipsiCell';

const TxRow = ({ tx, ellipsis }) => {
  const isMobile = useIsMobile();
  const ellipsisCount = isMobile ? 4 : 12;
  const navigate = useNavigate();

  const handleClickTr = hash => {
    navigate(`/transaction/${hash}`);
  };

  const renderNewUi = () => (
    <tr onClick={_e => handleClickTr(tx.tx_id)}>
      <td className=" d-lg-table-cell pe-3">
        {ellipsis ? (
          <EllipsiCell id={tx.tx_id} countBefore={ellipsisCount} countAfter={ellipsisCount} />
        ) : (
          tx.tx_id
        )}
      </td>
      <td className=" d-lg-table-cell pe-3 date-cell">
        {dateFormatter.parseTimestampNewUi(tx.timestamp)}
      </td>
    </tr>
  );

  return renderNewUi();
};

export default TxRow;
