/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';

const HathorSnackbar = forwardRef(({ type, text }, ref) => {
  const alertDiv = useRef(null);

  const show = duration => {
    if (alertDiv.current) {
      alertDiv.current.classList.add('show');

      setTimeout(() => {
        alertDiv.current.classList.remove('show');
      }, duration);
    }
  };

  useImperativeHandle(ref, () => ({
    show,
  }));

  return (
    <div
      ref={alertDiv}
      className={`new-hathor-alert alert alert-${type} alert-dismissible fade new-snack-bar`}
      role="alert"
      style={{ display: 'flex', flexDirection: 'row' }}
    >
      <p className="success-txt">{text}</p>
    </div>
  );
});

HathorSnackbar.displayName = 'HathorSnackbar';

export default HathorSnackbar;
