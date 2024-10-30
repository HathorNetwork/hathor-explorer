/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import TokenBalances from '../components/token/TokenBalances';
import { UNLEASH_TOKEN_BALANCES_FEATURE_FLAG } from '../constants';
import { useNewUiEnabled } from '../hooks';

const TokenBalancesList = () => {
  const maintenanceMode = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.maintenance`);
  const newUiEnabled = useNewUiEnabled();

  const renderUi = () => (
    <div className="content-wrapper">
      <TokenBalances maintenanceMode={maintenanceMode} newUiEnabled={newUiEnabled} />
    </div>
  );

  const renderNewUi = () => (
    <div className="section-tables-stylized">
      <TokenBalances maintenanceMode={maintenanceMode} newUiEnabled={newUiEnabled} />
    </div>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default TokenBalancesList;
