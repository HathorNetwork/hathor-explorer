/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent as RowDown } from '../assets/images/arrow-down-nav-dropdown.svg';

const CustomSelect = ({ options, onSelect, value }) => {
  const [open, setOpen] = useState(false);

  const selectRef = useRef(null);

  const handleOption = key => {
    onSelect(key);
    setOpen(false);
  };

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
      <div className="custom-select" onClick={() => setOpen(!open)}>
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

export default CustomSelect;
