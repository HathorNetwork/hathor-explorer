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

    render() {
        const renderTitle = () => {
            if (this.state.featureFlag) {
                return (<h2 className='statistics-title'>Historical Data</h2>);
            }
        }

        const renderDashboard = () => {
            if (this.state.featureFlag) {
                if (this.state.maintenanceMode) {
                    return (<ErrorMessageWithIcon message='This feature is under maintenance. Please try again after some time' />);
                } else {
                    return (
                        <div>
                            <ScreenStatusMessage />
                            <iframe title='Time Series Data' id='timeseries-iframe' className='timeseries-iframe' src={TIMESERIES_DASHBOARD_URL}></iframe>
                        </div>
                    );
                }
            }
        }

        return (
            <div>
                {renderTitle()}
                {renderDashboard()}
            </div>
        );
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