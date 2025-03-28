/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';

export const useNewUiLoad = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Remove this dynamic import after fully reviewing the removal of the old UI
    import('../newUi.css')
      .then(() => {
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load newUi.css:', error);
        setLoading(false);
      });
  }, []);

  return loading;
};
