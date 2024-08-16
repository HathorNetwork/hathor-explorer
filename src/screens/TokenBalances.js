/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TokenBalances from '../components/token/TokenBalances';
import { useFlag } from '@unleash/proxy-client-react';
import { UNLEASH_TOKEN_BALANCES_FEATURE_FLAG } from '../constants';

const TokenBalancesList = () => {
  const maintenanceMode = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.maintenance`);

  return (
    <div className="content-wrapper">
      <TokenBalances maintenanceMode={maintenanceMode} />
    </div>
  );
};

export default TokenBalancesList;
