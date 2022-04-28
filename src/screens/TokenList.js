/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Tokens from '../components/token/Tokens'
import { useFlag } from '@unleash/proxy-client-react';
import { REACT_APP_NETWORK } from '../constants'

const TokenList = () => {
    const maintenanceMode = useFlag(`explorer-tokens-${REACT_APP_NETWORK}.maintenance`);

    return (
        <div className="content-wrapper">
            <Tokens title={"Tokens"} maintenanceMode={maintenanceMode} />
        </div>
    );
}

export default TokenList;