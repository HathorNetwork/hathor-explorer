/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import Tokens from '../components/token/Tokens';
import { UNLEASH_TOKENS_BASE_FEATURE_FLAG } from '../constants';
import { useNewUiEnabled } from '../hooks';

const TokenList = () => {
  const maintenanceMode = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.maintenance`);
  const newUiEnabled = useNewUiEnabled();

  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <br />
        <div className="container-title-page">
          <p className="title-page">Tokens</p>
          <Tokens maintenanceMode={maintenanceMode} newUiEnabled={newUiEnabled} />
        </div>
      </div>
    );
  };

  const renderUi = () => {
    return (
      <div className="content-wrapper">
        <Tokens title={'Tokens'} maintenanceMode={maintenanceMode} newUiEnabled={newUiEnabled} />
      </div>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
};

export default TokenList;
