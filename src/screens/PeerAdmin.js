/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Network from '../components/Network';


class PeerAdmin extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <Network />
      </div>
    );
  }
}

export default PeerAdmin;