/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withRouter } from "react-router-dom";

class TokenRow extends React.Component {
    render() {
        return (
            <tr>
                <td className="d-lg-table-cell pr-3">{this.props.token.id}</td>
                <td className="d-lg-table-cell pr-3">{this.props.token.name}</td>
                <td className="d-lg-table-cell pr-3">{this.props.token.symbol}</td>
                <td className="d-lg-table-cell pr-3">{this.props.token.type}</td>
            </tr>
        );
    }
}

export default withRouter(TokenRow);