/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { get } from 'lodash';
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import { numberUtils } from '@hathor/wallet-lib';
import colors from '../index.scss';
import { useNewUiEnabled } from '../hooks';
import helpers from '../utils/helpers';
import TimeSeriesDashboard from './TimeSeriesDashboard';
import blockApi from '../api/blockApi';
import useTimelapseCounter from '../utils/useTimelapseCounter';

function Dashboard() {
  const newUiEnabled = useNewUiEnabled();
  const [timestamp, setTimestamp] = useState(null);

  useEffect(() => {
    const fetchInitialTimestamp = async () => {
      const blockApiResponse = await blockApi.getBestChainHeight();
      const blockApiResponseData = get(blockApiResponse, 'data.hits[0]', {});
      const apiTimestamp = blockApiResponseData.timestamp;

      if (apiTimestamp) {
        setTimestamp(new Date(apiTimestamp).getTime());
      }
    };

    fetchInitialTimestamp();
  }, []);

  const renderCount = useTimelapseCounter(timestamp);

  const { data } = useSelector(state => ({ data: state.data }));
  if (data === null) {
    return (
      <div className="content-wrapper">
        <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
      </div>
    );
  }

  const { transactions } = data;
  const height = data.best_block_height;

  const hashRateValue = parseFloat(data.hash_rate.toFixed(2));
  const prettyfied = helpers.divideValueIntoPrefix(hashRateValue);
  const prettyValue = prettyfied.value;
  const prefix = helpers.getUnitPrefix(prettyfied.divisions);
  const hashRate = `${prettyValue} ${prefix}h/s`;

  const bestBlockHeight = numberUtils.prettyValue(height, 0);
  const ptransactions = numberUtils.prettyValue(transactions, 0);

  const renderUi = () => (
    <div className="content-wrapper">
      <h2 className="statistics-title">Real time</h2>
      <p>
        <strong>Blocks (best height): </strong>
        {bestBlockHeight}
      </p>
      <p>
        <strong>Transactions: </strong>
        {ptransactions}
      </p>
      <p className="color-hathor">
        <strong>Hash rate: </strong>
        {hashRate}
      </p>
      <TimeSeriesDashboard />
    </div>
  );

  const renderNewUi = () => (
    <div className="statistics-content-wrapper">
      <div className="statistics-title-container">
        <h2 className="statistics-title">Statistics</h2>
        <span>Real time</span>
      </div>
      <div className="real-time-info-container">
        <span className="real-time-info">
          <strong>BLOCKS</strong>
          <span>{bestBlockHeight}</span>
          <p>UPDATED {renderCount} SECONDS AGO</p>
        </span>
        <span className="real-time-info">
          <strong>TRANSACTIONS</strong>
          <span>{ptransactions}</span>
          <p>UPDATED {renderCount} SECONDS AGO</p>
        </span>
        <span className="real-time-info">
          <strong>HASH RATE</strong>
          <span>{hashRate}</span>
          <p>UPDATED {renderCount} SECONDS AGO</p>
        </span>
      </div>
      <TimeSeriesDashboard />
    </div>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default Dashboard;
