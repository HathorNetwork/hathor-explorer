/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ReactComponent as SuccessIcon } from '../assets/images/success-icon.svg';

class NewHathorAlert extends React.Component {
  show(duration) {
    const el = this.refs.alertDiv;
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  render() {
    return (
      <div
        ref="alertDiv"
        className={`new-hathor-alert alert alert-${this.props.type} alert-dismissible fade`}
        role="alert"
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        <div className="success-icon">
          <SuccessIcon />
        </div>
        <p className="success-txt">{this.props.text}</p>
      </div>
    );
  }
}

export default NewHathorAlert;
