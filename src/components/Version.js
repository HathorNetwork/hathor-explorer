/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { VERSION } from '../constants';

function Version({ explorer }) {
  return (
    <div className="d-flex flex-column version-wrapper align-items-center">
      <span>
        {explorer ? 'Explorer ' : ''} Version {VERSION}
      </span>
    </div>
  );
}

export default Version;
