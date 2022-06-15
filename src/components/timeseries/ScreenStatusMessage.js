import React from 'react';
import { get } from 'lodash';

import blockApi from '../../api/blockApi';
import { SCREEN_STATUS_LOOP_INTERVAL_IN_SECONDS } from '../../constants';
import dateFormatter from '../../utils/date';
import helpers from '../../utils/helpers';

import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';
import Loading from '../Loading';


class ScreenStatusMessage extends React.Component {

    constructor() {
        super();

        this.state = {
            height: 0,
            timestamp: '',
            error: false,
            loading: true,
        };
    }

    componentDidMount = async () => {
        await this.getBestChainHeight();

        this.setState({
            loading: false
        });

        // Constantly execute the method to get the newest block
        this.screenStatusLoopExecution = setInterval(() => {
            this.getBestChainHeight();
        }, SCREEN_STATUS_LOOP_INTERVAL_IN_SECONDS * 1000);
    }

    componentWillUnmount() {
        // We need to clear the interval object we created when user leaves the page
        clearInterval(this.screenStatusLoopExecution);
    }

    /**
     * Calls the Explorer Service to get the best chain height
     * 
     */
    getBestChainHeight = async () => {
        const blockApiResponse = await blockApi.getBestChainHeight();

        const blockApiResponseData = get(blockApiResponse, 'data.hits[0]', []);

        this.setState({
            height: get(blockApiResponseData, 'height', 0),
            timestamp: get(blockApiResponseData, 'timestamp', ''),
            error: get(blockApiResponse, 'error', false),
        });
    }

    render() {
        return (
            <div>
                {
                    (this.state.error) ?
                        <ErrorMessageWithIcon message='Could not load the last block updated' /> :
                        (this.state.loading) ?
                            <Loading /> :
                            <p className='screen-status'>
                                <strong>
                                    This screen is updated until block at height {helpers.renderValue(this.state.height, true)} and the last update was on {dateFormatter.parseTimestampFromSQLTimestamp(this.state.timestamp)}
                                </strong>
                            </p>
                }
            </div>
        );
    }
}

export default ScreenStatusMessage;
