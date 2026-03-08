/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { get } from 'lodash';

import { numberUtils } from '@hathor/wallet-lib';
import blockApi from '../../api/blockApi';
import { SCREEN_STATUS_LOOP_INTERVAL_IN_SECONDS } from '../../constants';
import dateFormatter from '../../utils/date';

import ErrorMessageWithIcon from '../error/ErrorMessageWithIcon';
import Loading from '../Loading';

class ScreenStatusMessage extends React.Component {
  constructor() {
    super();
    this.screenStatusLoopExecution = null;

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
      loading: false,
    });

    // Constantly execute the method to get the newest block
    this.screenStatusLoopExecution = setInterval(() => {
      this.getBestChainHeight();
    }, SCREEN_STATUS_LOOP_INTERVAL_IN_SECONDS * 1000);
  };

  componentWillUnmount() {
    // We need to clear the interval object we created when user leaves the page
    if (this.screenStatusLoopExecution) {
      clearInterval(this.screenStatusLoopExecution);
    }
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
  };

  renderNewUi() {
    const height = numberUtils.prettyValue(this.state.height, 0);

    if (this.state.error) {
      return (
        <div>
          <ErrorMessageWithIcon message="Could not load the last block updated" />
        </div>
      );
    }

    if (this.state.loading) {
      return (
        <div>
          <Loading />
        </div>
      );
    }

    return (
      <div>
        <p className="screen-status-text-info">
          <strong>
            This screen is updated until block at height <span>{height}</span> and the last update
            was on{' '}
            <span>{dateFormatter.parseTimestampFromSQLTimestamp(this.state.timestamp)}.</span>
          </strong>
        </p>
      </div>
    );
  }

  render() {
    return this.renderNewUi();
  }
}

export default ScreenStatusMessage;
