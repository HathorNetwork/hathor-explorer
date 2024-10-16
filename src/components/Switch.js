/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMount } from '../hooks/useMount';
import { toggleTheme } from '../actions';

export const SwitchButton = () => {
  const [value, setvalue] = useState(false);
  const theme = useSelector(state => state.theme);
  const dispatch = useDispatch();

  useMount(() => {
    if (theme === 'dark') {
      setvalue(true);
    }
  });

  const changeValue = () => {
    setvalue(!value);
    dispatch(toggleTheme());
  };

  return (
    <div className={`switch ${value ? 'active' : ''}`} onClick={() => changeValue(!value)}>
      <div className="switch-circle"></div>
    </div>
  );
};
