/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Features from '../components/feature_activation/Features';

function FeatureList() {
  const renderNewUi = () => {
    return (
      <div className="section-tables-stylized">
        <Features title="Feature Activation" />
      </div>
    );
  };

  return renderNewUi();
}

export default FeatureList;
