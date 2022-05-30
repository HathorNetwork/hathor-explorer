/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withRouter } from "react-router-dom";
import hathorLib from '@hathor/wallet-lib';
import PropTypes from 'prop-types';
import dateFormatter from '../../utils/date';

class TokenRow extends React.Component {
  /**
    * Redirects to token detail screen after clicking on a table row
    *
    * @param {String} uid UID of token clicked
    */
  onRowClicked = (uid) => {
    this.props.history.push(`/token_detail/${uid}`);
  }

  render() {
    return (
      <tr onClick={(e) => this.onRowClicked(this.props.token.uid)}>
        <td className="d-lg-table-cell pr-3">{hathorLib.helpers.getShortHash(this.props.token.uid)}</td>
        <td className="d-lg-table-cell pr-3">{this.props.token.name}</td>
        <td className="d-lg-table-cell pr-3">{this.props.token.symbol}</td>
        <td className="d-lg-table-cell pr-3">{this.props.token.nft ? 'NFT' : 'Custom Token'}</td>
        <td className="d-lg-table-cell pr-3">{dateFormatter.parseTimestamp(this.props.token.transaction_timestamp)}</td>
      </tr>
    );
  }
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
    transaction_timestamp: PropTypes.number.isRequired
  }),
}

export default withRouter(TokenRow);
