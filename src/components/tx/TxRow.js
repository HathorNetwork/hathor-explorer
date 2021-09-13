/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormatter from '../../utils/date';
import { withRouter } from "react-router-dom";
import hathorLib from '@hathor/wallet-lib';


class TxRow extends React.Component {

  handleClickTr = (hash) => {
    this.props.history.push(`/transaction/${hash}`);
  }

  render() {
    return (
      <tr onClick={(e) => this.handleClickTr(this.props.tx.tx_id)}>
        <td className="d-none d-lg-table-cell pr-3">{this.props.tx.tx_id}</td>
        <td className="d-none d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(this.props.tx.timestamp)}</td>
        <td className="d-lg-none d-table-cell pr-3" colSpan="2">{hathorLib.helpers.getShortHash(this.props.tx.tx_id)} {dateFormatter.parseTimestamp(this.props.tx.timestamp)}</td>
      </tr>
    );
  }
}

export default withRouter(TxRow);
