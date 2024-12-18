/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import { numberUtils } from '@hathor/wallet-lib';
import colors from '../index.scss';
import { useNewUiEnabled } from '../hooks';
import helpers from '../utils/helpers';
import TimeSeriesDashboard from './TimeSeriesDashboard';
import useTimelapseCounter from '../hooks/useTimelapseCounter';

function Dashboard() {
  const newUiEnabled = useNewUiEnabled();
  const [timestamp, setTimestamp] = useState(null);
  /**
   * Data from the last block received from the WS
   * @property {number} transactions Number of transactions in the last block
   * @property {number} best_block_height Best block height
   * @property {number} hash_rate Hash rate
   */
  const heightData = useSelector(state => state.data);
  const [summary, setSummary] = useState({
    transactions: 0,
    hashRate: 0.0,
    bestBlockHeight: 0,
  });
  const renderCount = useTimelapseCounter(timestamp);

  // Calculating the summary data
  useEffect(() => {
    // Skip this effect if there is no summary data
    if (!heightData) {
      return;
    }

    // Do not recalculate if the exhibited data has not changed
    if (
      heightData.best_block_height === summary.bestBlockHeight &&
      heightData.transactions === summary.transactions
    ) {
      return;
    }

    const newSummary = { ...summary };

    // Handling the transactions number
    if (heightData.transactions !== summary.transactions) {
      newSummary.transactions = heightData.transactions;
    }

    // Handling the best block height, hash rate and sync timestamp
    if (heightData.best_block_height !== summary.bestBlockHeight) {
      newSummary.bestBlockHeight = heightData.best_block_height;
      newSummary.hashRate = heightData.hash_rate;

      // Setting the timestamp of when the last block was synced with this screen
      setTimestamp(new Date(heightData.time * 1000));
    }

    setSummary(newSummary);
  }, [heightData, summary]);

  if (heightData === null) {
    return (
      <div className="content-wrapper">
        <ReactLoading type="spin" color={colors.purpleHathor} delay={500} />
      </div>
    );
  }

  const hashRateValue = parseFloat(summary.hashRate.toFixed(2));
  const prettified = helpers.divideValueIntoPrefix(hashRateValue);
  const prettyValue = prettified.value;
  const prefix = helpers.getUnitPrefix(prettified.divisions);
  const hashRate = `${prettyValue} ${prefix}h/s`;

  const bestBlockHeight = numberUtils.prettyValue(summary.bestBlockHeight, 0);
  const transactions = numberUtils.prettyValue(summary.transactions, 0);

  const renderUi = () => (
    <div className="content-wrapper">
      <h2 className="statistics-title">Real time</h2>
      <p>
        <strong>Blocks (best height): </strong>
        {bestBlockHeight}
      </p>
      <p>
        <strong>Transactions: </strong>
        {transactions}
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
        <span className="synced-at">
          <p>LATEST BLOCK {renderCount} SECONDS AGO</p>
        </span>
      </div>
      <div className="real-time-info-container">
        <span className="real-time-info">
          <strong>BLOCKS</strong>
          <span>{bestBlockHeight}</span>
        </span>
        <span className="real-time-info">
          <strong>TRANSACTIONS</strong>
          <span>{transactions}</span>
        </span>
        <span className="real-time-info">
          <strong>HASH RATE</strong>
          <span>{hashRate}</span>
        </span>
      </div>
      <TimeSeriesDashboard />
    </div>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default Dashboard;
