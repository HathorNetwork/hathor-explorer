/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';


class HathorAlert extends React.Component {
  show(duration) {
    const el = this.refs.alertDiv;
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  render() {
    return (
      <div ref="alertDiv" className={`hathor-alert alert alert-${this.props.type} alert-dismissible fade col-10 col-sm-3`} role="alert">
        {this.props.text}
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    );
  }
}

export default HathorAlert;