/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Features from '../components/feature_activation/Features';

function FeatureList() {
  return (
    <div className="content-wrapper">
      <Features title={<h1>Feature Activation</h1>} />
    </div>
  );
}

export default FeatureList;
