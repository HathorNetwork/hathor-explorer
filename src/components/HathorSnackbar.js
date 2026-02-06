/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * HathorSnackbar component renders a snackbar (alert) that can be shown for a specific duration.
 * This component is designed to provide feedback to the user in the form of a message with different types (e.g., success, error).
 *
 * @param {string} type - The type of the alert, which defines its appearance and color.
 *                        Common values could include 'success', 'error', 'info', etc.
 *
 * @param {string} text - The message text to be displayed within the snackbar.
 *
 * @ref {Object} ref - A reference object that can be used to trigger the `show` method programmatically
 *                      from the parent component. The `show` method will display the snackbar for a given duration.
 *
 * @returns {JSX.Element} The HathorSnackbar component.
 */
const HathorSnackbar = forwardRef(({ type, text }, ref) => {
  const alertDiv = useRef(null);

  /**
   * Shows the snackbar for a specified duration.
   *
   * @param {number} duration - The duration (in milliseconds) for which the snackbar should be visible.
   */
  const show = duration => {
    if (alertDiv.current) {
      alertDiv.current.classList.add('show');

      setTimeout(() => {
        alertDiv.current.classList.remove('show');
      }, duration);
    }
  };

  // Exposing the show function to the parent component via the ref
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

// Define the display name for the component
HathorSnackbar.displayName = 'HathorSnackbar';

export default HathorSnackbar;
