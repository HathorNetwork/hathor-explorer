/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useFlag } from '@unleash/proxy-client-react';
import { UNLEASH_NEW_UI_FEATURE_FLAG } from '../constants';

export const useNewUiEnabled = () => {
  const newUiEnabled = useFlag(UNLEASH_NEW_UI_FEATURE_FLAG);

  return newUiEnabled;
};
