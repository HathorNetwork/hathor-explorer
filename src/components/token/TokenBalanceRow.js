/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { numberUtils } from '@hathor/wallet-lib';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  decimalPlaces: state.serverInfo.decimal_places,
});

class TokenBalanceRow extends React.Component {
  /**
   * Redirects to token detail screen after clicking on a table row
   *
   * @param {String} uid UID of token clicked
   */
  onRowClicked = () => {
    this.props.history.push(`/address/${this.props.address}?token=${this.props.tokenId}`);
  };

  render() {
    return (
      <tr onClick={e => this.onRowClicked(this.props.address)}>
        <td className="d-lg-table-cell pr-3">{this.props.address}</td>
        <td className="d-lg-table-cell pr-3">
          {numberUtils.prettyValue(this.props.total, this.props.decimalPlaces)}
        </td>
        <td className="d-lg-table-cell pr-3">
          {numberUtils.prettyValue(this.props.unlocked, this.props.decimalPlaces)}
        </td>
        <td className="d-lg-table-cell pr-3">
          {numberUtils.prettyValue(this.props.locked, this.props.decimalPlaces)}
        </td>
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
TokenBalanceRow.propTypes = {
  address: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  unlocked: PropTypes.number.isRequired,
  locked: PropTypes.number.isRequired,
  tokenId: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(withRouter(TokenBalanceRow));
