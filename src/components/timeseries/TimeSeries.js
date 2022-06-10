import React from 'react';
import PropTypes from 'prop-types';

import { TIMESERIES_DASHBOARD_URL } from '../../constants';
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';

import ScreenStatusMessage from './ScreenStatusMessage';

class TimeSeries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            maintenanceMode: this.props.maintenanceMode
        };
    }

    render() {
        return (
            (!this.state.maintenanceMode) ?
                <div>
                    <ScreenStatusMessage maintenanceMode={this.state.maintenanceMode} />
                    <iframe title='Time Series Data' id='timeseries-iframe' className='timeseries-iframe' src={TIMESERIES_DASHBOARD_URL}></iframe>
                </div> :
                <ErrorMessageWithIcon message='This feature is under maintenance. Please try again after some time' />
        )
    }
}

/**
 * maintenanceMode: A "circuit breaker" to remove additional load when a problem is affecting explorer-service or its downstream services
 */
TimeSeries.propTypes = {
    maintenanceMode: PropTypes.bool.isRequired,
};

export default TimeSeries;