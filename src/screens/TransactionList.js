/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Transactions from '../components/Transactions';


class TransactionList extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <Transactions type="tx" />
      </div>
    );
  }
}

export default TransactionList;