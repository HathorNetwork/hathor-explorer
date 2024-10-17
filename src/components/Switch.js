/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../actions';

export const SwitchButton = () => {
  const [value, setValue] = useState(false);
  const theme = useSelector(state => state.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    if (theme === 'dark') {
      setValue(true);
    }
  }, []);

  const changeValue = () => {
    setValue(!value);
    dispatch(toggleTheme());
  };

  return (
    <div className={`switch ${value ? 'active' : ''}`} onClick={() => changeValue()}>
      <div className="switch-circle"></div>
    </div>
  );
};
