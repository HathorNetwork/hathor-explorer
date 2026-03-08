/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import { numberUtils } from '@hathor/wallet-lib';
import colors from '../index.scss';
import helpers from '../utils/helpers';
import TimeSeriesDashboard from './TimeSeriesDashboard';
import useTimelapseCounter from '../hooks/useTimelapseCounter';

function Dashboard() {
  const [timestamp, setTimestamp] = useState(null);
  /**
   * @property {number} transactions
   * @property {number} bestBlockHeight
   * @property {number} hashRate
   * @property {number} lastTimestamp
   */
  const { transactions, bestBlockHeight, hashRate, bestTimestamp } = useSelector(state => {
    return {
      transactions: state.data?.transactions,
      bestBlockHeight: state.data?.best_block_height,
      hashRate: state.data?.hash_rate,
      bestTimestamp: state.data?.time,
    };
  });
  const lastBlockHeight = useRef(bestBlockHeight);
  const renderCount = useTimelapseCounter(timestamp);

  // Calculating the timestamp data
  useEffect(() => {
    // Do not recalculate if the exhibited data has not changed
    if (bestBlockHeight === lastBlockHeight.current) {
      return;
    }

    // Setting the timestamp of when this screen was last updated with a block height
    lastBlockHeight.current = bestBlockHeight;
    setTimestamp(new Date(bestTimestamp * 1000));
  }, [bestBlockHeight, bestTimestamp]);

  if (!bestBlockHeight) {
    return (
      <div className="content-wrapper">
        <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
      </div>
    );
  }

  const hashRateValue = parseFloat(hashRate.toFixed(2));
  const prettified = helpers.divideValueIntoPrefix(hashRateValue);
  const prettyValue = prettified.value;
  const prefix = helpers.getUnitPrefix(prettified.divisions);
  const formattedHashRate = `${prettyValue} ${prefix}h/s`;

  const formattedBestBlockHeight = numberUtils.prettyValue(bestBlockHeight, 0);
  const formattedTransactions = numberUtils.prettyValue(transactions, 0);

  const renderNewUi = () => (
    <div className="statistics-content-wrapper">
      <div className="statistics-title-container">
        <h2 className="statistics-title">Statistics</h2>
        <span>Real time</span>
        <span className="synced-at">
          <p>LATEST BLOCK {renderCount} SECONDS AGO</p>
        </span>
      </div>
      <div className="real-time-info-container">
        <span className="real-time-info">
          <strong>BLOCKS</strong>
          <span>{formattedBestBlockHeight}</span>
        </span>
        <span className="real-time-info">
          <strong>TRANSACTIONS</strong>
          <span>{formattedTransactions}</span>
        </span>
        <span className="real-time-info">
          <strong>HASH RATE</strong>
          <span>{formattedHashRate}</span>
        </span>
      </div>
      <TimeSeriesDashboard />
    </div>
  );

  return renderNewUi();
}

export default Dashboard;
