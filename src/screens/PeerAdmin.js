/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewUiEnabled } from '../hooks';
import Network from '../components/Network';

function PeerAdmin() {
  const navigate = useNavigate();
  const params = useParams();
  const newUiEnabled = useNewUiEnabled();

  const renderUi = () => (
    <div className="content-wrapper">
      <Network navigate={navigate} match={params} />
    </div>
  );

  const renderNewUi = () => (
    <div className="network-wrapper">
      <h2 className="network-title">Network</h2>
      <div>
        <Network navigate={navigate} match={params} newUiEnabled={newUiEnabled} />
      </div>
    </div>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default PeerAdmin;
