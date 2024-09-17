/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import { numberUtils } from '@hathor/wallet-lib';
import colors from '../index.scss';
import helpers from '../utils/helpers';
import TimeSeriesDashboard from './TimeSeriesDashboard';

function Dashboard() {
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
  return (
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
}

export default Dashboard;
