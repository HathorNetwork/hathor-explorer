/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';


class FeatureRow extends React.Component {
  render() {
    const { acceptance } = this.props.feature
    const acceptance_percentage = acceptance === null ? '-' : `${(acceptance * 100).toFixed(0)}%`

    return (
      <tr>
        <td className="d-lg-table-cell pr-3">{this.props.feature.name}</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.state}</td>
        <td className="d-lg-table-cell pr-3">{acceptance_percentage}</td>
        <td className="d-lg-table-cell pr-3">{(this.props.feature.threshold * 100).toFixed(0)}%</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.start_height}</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.minimum_activation_height}</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.timeout_height}</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.lock_in_on_timeout.toString()}</td>
        <td className="d-lg-table-cell pr-3">{this.props.feature.version}</td>
      </tr>
    );
  }
}

export default FeatureRow;
