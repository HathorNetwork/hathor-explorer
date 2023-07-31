/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import featureActivation from '../../utils/featureActivation';


class SignalBitRow extends React.Component {
  render() {
    const { bit, signal, feature, feature_state } = this.props.signalBit
    const prettyState = featureActivation.getPrettyState(feature_state)
    const prettySignal = signal === 1 ? '✓' : ''

    return (
      <tr>
        <td className="d-lg-table-cell pr-3">{bit}</td>
        <td className="d-lg-table-cell pr-3">{prettySignal}</td>
        <td className="d-lg-table-cell pr-3">{feature || '—'}</td>
        <td className="d-lg-table-cell pr-3">{prettyState || '—'}</td>
      </tr>
    );
  }
}

export default SignalBitRow;
