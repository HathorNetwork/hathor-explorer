/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Tokens from '../components/token/Tokens'

class TokenList extends React.Component {
    render() {
        return (
            <div className="content-wrapper">
                <Tokens title={<h1>Tokens</h1>} />
            </div>
        );
    }
};

export default TokenList;