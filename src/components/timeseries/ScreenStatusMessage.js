import React from 'react';
import { get } from 'lodash';

import blockApi from '../../api/blockApi';
import dateFormatter from '../../utils/date';
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
        const screenStatusLoopExecution = setInterval(() => {
            this.getBestChainHeight();
        }, 60000); // 60 seconds. This is the interval that ElasticSearch takes to ingest data from blocks

        this.setState({ screenStatusLoopExecution });
    }

    componentWillUnmount() {
        // We need to clear the interval object we created when user leaves the page
        clearInterval(this.state.screenStatusLoopExecution);
    }

    /**
     * Calls the Explorer Service to get the best chain height
     * 
     * @returns 
     */
    getBestChainHeight = async () => {
        const blockApiResponse = await blockApi.getBestChainHeight();
        const blockApiResponseStatus = get(blockApiResponse, 'status', 500);

        if (blockApiResponseStatus > 299) {
            this.setState({
                error: true,
            });
            return;
        }

        const blockApiResponseData = get(blockApiResponse, 'data.hits[0]', []);

        this.setState({
            height: get(blockApiResponseData, 'height', 0),
            timestamp: get(blockApiResponseData, 'timestamp', ''),
            error: false,
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
                            <p>
                                <strong>
                                    This screen is updated until block at height {this.state.height} and the last update was on {dateFormatter.parseTimestampFromSQLTimestamp(this.state.timestamp)}
                                </strong>
                            </p>
                }
            </div>
        );
    }
}

export default ScreenStatusMessage;
