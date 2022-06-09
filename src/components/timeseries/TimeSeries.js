import React from 'react'
import ScreenStatusMessage from './ScreenStatusMessage';
import { TIMESERIES_DASHBOARD_URL } from '../../constants'
import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon'

class TimeSeries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            maintenanceMode: this.props.maintenanceMode
        }
    }

    render() {
        return (
            (!this.state.maintenanceMode) ?
                <div>
                    <ScreenStatusMessage maintenanceMode={this.state.maintenanceMode} />
                    <iframe id='timeseries-iframe' className='timeseries-iframe' src={TIMESERIES_DASHBOARD_URL}></iframe>
                </div> :
                <ErrorMessageWithIcon message='This feature is under maintenance. Please try again after some time' />
        )
    }
}

export default TimeSeries;