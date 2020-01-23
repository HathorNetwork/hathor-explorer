/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from "react-redux";
import LineChartRealTime from '../components/LineChartRealTime';
import AreaChartRealTime from '../components/AreaChartRealTime';
import colors from '../index.scss';


const mapStateToProps = (state) => {
  return { data: state.data };
};


class Dashboard extends React.Component {
  getXData(d) {
    return d.date;
  }

  getYTxRate(d) {
    return [parseFloat(d.txRate.toFixed(2))];
  }

  getYTx(d) {
    return [d.transactions];
  }

  getYBlock(d) {
    return [d.blocks];
  }

  getYHashRate(d) {
    return [parseFloat(d.hash_rate.toFixed(2))];
  }

  getYPeers(d) {
    return [d.peers];
  }

  getYFullHashRate(d) {
    return [parseFloat(d.block_hash_rate.toFixed(2)), parseFloat(d.tx_hash_rate.toFixed(2))];
  }

  getYStackedHashRate(d) {
    return [parseFloat(d.block_hash_rate.toFixed(2)), parseFloat(d.network_hash_rate.toFixed(2))];
  }

  render() {
    const blocks = this.props.data.length > 0 ? this.props.data[this.props.data.length - 1].blocks : '';
    const transactions = this.props.data.length > 0 ? this.props.data[this.props.data.length - 1].transactions : '';
    const peers = this.props.data.length > 0 ? this.props.data[this.props.data.length - 1].peers : '';
    const height = this.props.data.length > 0 ? this.props.data[this.props.data.length - 1].best_block_height : '';
    return (
      <div className="content-wrapper">
        <p><strong>Blocks: </strong>{blocks}</p>
        <p><strong>Height of the best chain: </strong>{height}</p>
        <p><strong>Transactions: </strong>{transactions}</p>
        <p><strong>Peers: </strong>{peers}</p>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYHashRate} unit="h/s" title={["Hash Rate"]} colors={[colors.purpleHathor]} />
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);