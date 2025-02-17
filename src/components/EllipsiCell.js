/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

const EllipsiCell = ({ id, countBefore, countAfter }) => {
  const idStart = id.substring(0, countBefore);
  const idEnd = id.substring(id.length - (countAfter), id.length);

  return (
    <div className="id-cell">
      {idStart}
      <div className="ellipsis">
        <div className="ellipsi"></div>
        <div className="ellipsi"></div>
        <div className="ellipsi"></div>
      </div>
      {idEnd}
    </div>
  );
};

export default EllipsiCell;
