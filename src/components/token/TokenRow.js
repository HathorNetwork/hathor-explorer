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
                <td className="d-lg-table-cell pr-3">{this.props.token.type}</td>
            </tr>
        );
    }
}


/**
 * uid: Token UID
 * name: Token name
 * symbol: Token symbol
 * type: If token is a Custom Token or a NFT
 */
TokenRow.propTypes = {
    token: PropTypes.shape({
        uid: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        symbol: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired
    })
}

export default withRouter(TokenRow);