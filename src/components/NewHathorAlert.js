/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { ReactComponent as SuccessIcon } from '../assets/images/success-icon.svg';

/**
 * NewHathorAlert - A functional alert component with an icon and customizable display duration.
 * This component can be shown for a specified duration by calling the `show` method from its parent component.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.type - Defines the alert type for styling (e.g., "success", "error").
 * @param {string} props.text - The message text displayed in the alert.
 * @param {boolean} [props.fixedPosition=false] - If true, the alert will be fixed at the bottom center of the screen
 * @param {React.Ref} ref - A reference to call the `show` method from parent components.
 *
 * @example:
 * ```javascript
 * const alertRef = useRef(null);
 * // Somewhere in the render we would have <NewHathorAlert ... ref={alertRef} />
 * alertRef.current.show(2000); // Show the alert for 2 seconds
 * ```
 */
const NewHathorAlert = forwardRef(({ type, text, fixedPosition }, ref) => {
  const containerDiv = useRef(null);
  const alertDiv = useRef(null);

  /**
   * Displays the alert by adding the `show` class, then hides it after a specified duration.
   *
   * @param {number} duration - The display duration for the alert in milliseconds.
   */
  const show = duration => {
    // If the component is not in a fixed position, only handle the alert component
    if (!fixedPosition) {
      showAlertComponent();
      return;
    }

    // No-op if the container is unavailable
    if (!containerDiv?.current) {
      return;
    }

    // The component is in a fixed position: managing its parent container to allow for animations
    // and precise positioning
    containerDiv.current.classList.add('show');
    setTimeout(showAlertComponent, 100); // Delay the alert display to accomodate animations
    setTimeout(() => {
      // By the time the timeout is called, the container may have been unmounted
      if (containerDiv?.current) {
        containerDiv.current.classList.remove('show');
      }
    }, duration + 500);

    /**
     * Handles the Alert component display and removal
     */
    function showAlertComponent() {
      // No-op if the ref is unavailable
      if (!alertDiv?.current) {
        return;
      }

      alertDiv.current.classList.add('show');
      setTimeout(() => {
        // By the time the timeout is called, the component may have been unmounted
        if (alertDiv?.current) {
          alertDiv.current.classList.remove('show');
        }
      }, duration);
    }
  };

  useImperativeHandle(ref, () => ({
    show,
  }));

  /**
   * Renders the alert component
   * @returns {Element}
   */
  function renderAlertDiv() {
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
  }

  // If the component is in a fixed position, also render its parent container on demand
  if (fixedPosition) {
    return (
      <div ref={containerDiv} className="new-hathor-alert-container">
        {renderAlertDiv()}
      </div>
    );
  }

  // Render only the alert component
  return renderAlertDiv();
});

NewHathorAlert.displayName = 'NewHathorAlert';

export default NewHathorAlert;
