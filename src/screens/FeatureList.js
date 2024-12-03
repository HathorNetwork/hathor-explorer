/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Features from '../components/feature_activation/Features';
import { useNewUiEnabled } from '../hooks';

function FeatureList() {
  const newUiEnabled = useNewUiEnabled();

  const renderUi = () => {
    return (
      <div className="content-wrapper">
        <Features title={<h1>Feature Activation</h1>} />
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <Features title="Feature Activation" newUiEnabled={newUiEnabled} />
      </div>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default FeatureList;
