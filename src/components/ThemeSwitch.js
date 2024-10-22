/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../actions';

export const ThemeSwitch = () => {
  const theme = useSelector(state => state.theme);
  const dispatch = useDispatch();

  const changeValue = () => {
    dispatch(toggleTheme());
  };

  return (
    <div className={`switch ${theme === 'dark' ? 'active' : ''}`} onClick={() => changeValue()}>
      <div className="switch-circle"></div>
    </div>
  );
};
