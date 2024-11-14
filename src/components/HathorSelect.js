/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent as RowDown } from '../assets/images/arrow-down-nav-dropdown.svg';

/**
 * HathorSelect component renders a dropdown menu for selecting an option.
 *
 * @param {Array} options - List of options to display in the dropdown.
 * Each option should be an object with the following structure:
 * {
 *   key: <string | number>, // Unique identifier for each option.
 *   name: <string>          // Display name for the option.
 * }
 *
 * @param {Function} onSelect - Callback function triggered when an option is selected.
 * Receives the key of the selected option as an argument.
 *
 * @param {Object} value - The current selected option, with the same structure as an option:
 * {
 *   key: <string | number>, // Unique identifier for the current selected option.
 *   name: <string>          // Display name for the current selected option.
 * }
 */
const HathorSelect = ({ options, onSelect, value, background }) => {
  const [open, setOpen] = useState(false);

  const selectRef = useRef(null);

  /**
   * Handles option selection by calling the onSelect function with the selected key,
   * and closes the dropdown menu.
   *
   * @param {string | number} key - The unique identifier of the selected option.
   */
  const handleOption = key => {
    onSelect(key);
    setOpen(false);
  };

  /**
   * Closes the dropdown menu if a click occurs outside of the component.
   *
   * @param {MouseEvent} event - The mouse event triggered on document click.
   */
  const handleClickOutside = event => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-select-container" ref={selectRef}>
      <div
        className="custom-select"
        onClick={() => setOpen(!open)}
        style={{ backgroundColor: `${background}` }}
      >
        {value.name}
        <RowDown width="10px" height="10px" />
      </div>
      <div className="custom-select-options" style={{ display: open ? 'block' : 'none' }}>
        <ul>
          {options.map(option => (
            <li key={option.key} onClick={() => handleOption(option.key)}>
              {option.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HathorSelect;
