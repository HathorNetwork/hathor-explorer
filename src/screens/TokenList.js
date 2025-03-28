/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useNavigate } from 'react-router-dom';
import Tokens from '../components/token/Tokens';
import { UNLEASH_TOKENS_BASE_FEATURE_FLAG } from '../constants';

const TokenList = () => {
  const maintenanceMode = useFlag(`${UNLEASH_TOKENS_BASE_FEATURE_FLAG}.maintenance`);
  const navigate = useNavigate();

  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <br />
        <div className="container-title-page">
          <p className="title-page">Tokens</p>
          <Tokens maintenanceMode={maintenanceMode} navigate={navigate} />
        </div>
      </div>
    );
  };

  return renderNewUi();
};

export default TokenList;
