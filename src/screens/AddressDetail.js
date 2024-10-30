/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useHistory } from 'react-router-dom/cjs/react-router-dom';
import { useParams } from 'react-router-dom';
import AddressDetailExplorer from '../components/AddressDetailExplorer';
import AddressDetailLegacy from '../components/AddressDetailLegacy';
import { UNLEASH_ADDRESS_DETAIL_BASE_FEATURE_FLAG } from '../constants';
import ErrorMessageWithIcon from '../components/error/ErrorMessageWithIcon';

const AddressDetail = () => {
  const maintenanceMode = useFlag(`${UNLEASH_ADDRESS_DETAIL_BASE_FEATURE_FLAG}.maintenance`);
  const latestMode = useFlag(`${UNLEASH_ADDRESS_DETAIL_BASE_FEATURE_FLAG}.latest`);
  const history = useHistory();
  const params = useParams();

  if (maintenanceMode) {
    return (
      <ErrorMessageWithIcon message="This feature is under maintenance. Please try again after some time" />
    );
  }

  if (latestMode) {
    return <AddressDetailExplorer />;
  }

  return <AddressDetailLegacy history={history} match={{ params }} />;
};

export default AddressDetail;
