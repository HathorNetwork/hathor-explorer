/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Network from '../components/Network';

function PeerAdmin(props) {
  return (
    <div className="content-wrapper">
      <Network {...props} />
    </div>
  );
}

export default PeerAdmin;
