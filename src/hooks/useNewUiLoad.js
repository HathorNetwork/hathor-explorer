/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';
import { useNewUiEnabled } from './useNewUiEnabled';

export const useNewUiLoad = () => {
  const [loading, setLoading] = useState(true);
  const newUiEnabled = useNewUiEnabled();

  useEffect(() => {
    if (!newUiEnabled) {
      setLoading(false);
      return;
    }

    import('../newUi.css')
      .then(() => {
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load newUi.css:', error);
        setLoading(false);
      });
  }, [newUiEnabled]);

  return loading;
};
