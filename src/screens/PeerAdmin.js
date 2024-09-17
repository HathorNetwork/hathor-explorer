/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Network from '../components/Network';

function PeerAdmin() {
  const history = useHistory();
  const params = useParams();

  return (
    <div className="content-wrapper">
      <Network history={history} match={params} />
    </div>
  );
}

export default PeerAdmin;
