/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';

import TimeSeries from '../components/timeseries/TimeSeries';
import { UNLEASH_TIME_SERIES_FEATURE_FLAG } from '../constants';


const TimeSeriesDashboard = () => {
    const maintenanceMode = useFlag(`${UNLEASH_TIME_SERIES_FEATURE_FLAG}.maintenance`);

    return (
        <div>
            <TimeSeries maintenanceMode={maintenanceMode} />
        </div>
    );

}

export default TimeSeriesDashboard;