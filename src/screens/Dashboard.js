/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from "react-redux";
import colors from '../index.scss';
import ReactLoading from 'react-loading';
import helpers from '../utils/helpers';
import TimeSeriesDashboard from './TimeSeriesDashboard';


const mapStateToProps = (state) => {
  return { data: state.data };
};


class Dashboard extends React.Component {
  render() {
    if (this.props.data === null) {
      return (
        <div className="content-wrapper">
          <ReactLoading type='spin' color={colors.purpleHathor} delay={500} />
        </div>
      );
    }

    const transactions = this.props.data.transactions;
    const height = this.props.data.best_block_height;

    const hashRateValue = parseFloat(this.props.data.hash_rate.toFixed(2));
    const prettyfied = helpers.divideValueIntoPrefix(hashRateValue);
    const prettyValue = prettyfied.value;
    const prefix = helpers.getUnitPrefix(prettyfied.divisions);
    const hashRate = `${prettyValue} ${prefix}h/s`;

    return (
      <div className="content-wrapper">
        <h2 className='statistics-title'>Real time</h2>
        <p><strong>Blocks (best height): </strong>{helpers.renderValue(height, true)}</p>
        <p><strong>Transactions: </strong>{helpers.renderValue(transactions, true)}</p>
        <p className="color-hathor"><strong>Hash rate: </strong>{hashRate}</p>

        <TimeSeriesDashboard />
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);