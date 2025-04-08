/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { TIMESERIES_DASHBOARD_URL } from '../../constants';
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';

import ScreenStatusMessage from './ScreenStatusMessage';

class TimeSeries extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      maintenanceMode: this.props.maintenanceMode,
      featureFlag: this.props.featureFlag,
    };
  }

  renderNewUi() {
    if (!this.state.featureFlag) {
      return null;
    }

    const renderDashboard = () => {
      if (this.state.maintenanceMode) {
        return (
          <ErrorMessageWithIcon message="This feature is under maintenance. Please try again after some time" />
        );
      }
      return (
        <div>
          <ScreenStatusMessage />
          <iframe
            title="Time Series Data"
            id="timeseries-iframe"
            className="new-timeseries-iframe"
            src={TIMESERIES_DASHBOARD_URL}
          ></iframe>
        </div>
      );
    };

    return (
      <div>
        <h2 className="statistics-data-title">Historical Data</h2>
        {renderDashboard()}
      </div>
    );
  }

  render() {
    return this.renderNewUi();
  }
}

/**
 * maintenanceMode: A "circuit breaker" to remove additional load when a problem is affecting explorer-service or its downstream services
 * featureFlag: Indicate if feature is enabled on Unleash
 */
TimeSeries.propTypes = {
  maintenanceMode: PropTypes.bool.isRequired,
  featureFlag: PropTypes.bool.isRequired,
};

export default TimeSeries;
