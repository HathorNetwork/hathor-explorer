/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';

const useTimelapseCounter = initialTimestamp => {
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const secondsAgo = Math.floor((Date.now() - initialTimestamp) / 1000);
      setRenderCount(secondsAgo);
    }, 200);

    return () => clearInterval(interval);
  }, [initialTimestamp]);

  return renderCount;
};

export default useTimelapseCounter;
