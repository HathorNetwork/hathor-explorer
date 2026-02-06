/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useFlag } from '@unleash/proxy-client-react';
import TokenBalances from '../components/token/TokenBalances';
import { UNLEASH_TOKEN_BALANCES_FEATURE_FLAG } from '../constants';

const TokenBalancesList = () => {
  const maintenanceMode = useFlag(`${UNLEASH_TOKEN_BALANCES_FEATURE_FLAG}.maintenance`);

  const renderNewUi = () => (
    <div className="section-tables-stylized">
      <TokenBalances maintenanceMode={maintenanceMode} />
    </div>
  );

  return renderNewUi();
};

export default TokenBalancesList;
