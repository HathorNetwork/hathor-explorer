/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { ReactComponent as SuccessIcon } from '../assets/images/success-icon.svg';

/**
 * NewHathorAlert - A functional alert component with an icon and customizable display duration.
 * This component can be shown for a specified duration by calling the `show` method from its parent component.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.type - Defines the alert type for styling (e.g., "success", "error").
 * @param {string} props.text - The message text displayed in the alert.
 * @param {React.Ref} ref - A reference to call the `show` method from parent components.
 *
 * @example:
 * ```javascript
 * const alertRef = useRef(null);
 * // Somewhere in the render we would have <NewHathorAlert ... ref={alertRef} />
 * alertRef.current.show(2000); // Show the alert for 2 seconds
 * ```
 */
const NewHathorAlert = forwardRef(({ type, text, showAlert }, ref) => {
  const alertDiv = useRef(null);

  /**
   * Displays the alert by adding the `show` class, then hides it after a specified duration.
   *
   * @param {number} duration - The display duration for the alert in milliseconds.
   */
  const show = duration => {
    if (alertDiv.current) {
      alertDiv.current.classList.add('show');
      setTimeout(() => {
        alertDiv.current.classList.remove('show');
      }, duration);
    }
  };

  useEffect(() => {
    if (showAlert === undefined) {
      return;
    }
    if (showAlert) {
      alertDiv.current.classList.add('show');
    } else {
      alertDiv.current.classList.remove('show');
    }
  }, [showAlert]);

  useImperativeHandle(ref, () => ({
    show,
  }));

  return (
    <div
      ref={alertDiv}
      className={`new-hathor-alert alert alert-${type} alert-dismissible fade`}
      role="alert"
      style={{ display: 'flex', flexDirection: 'row' }}
    >
      <div className="success-icon">{type === 'success' ? <SuccessIcon /> : null}</div>
      <p className="success-txt">{text}</p>
    </div>
  );
});

NewHathorAlert.displayName = 'NewHathorAlert';

export default NewHathorAlert;
