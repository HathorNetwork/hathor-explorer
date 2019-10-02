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
    return (
      <div className="content-wrapper">
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTxRate} unit="tx/s" title={["Tx Rate"]}/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTx} title={["Transactions"]} />
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYBlock} title={["Blocks"]}/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYHashRate} unit="hashes/s" title={["Hash Rate"]}/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYFullHashRate} unit="hashes/s" title={["Block Hash Rate", "Tx Hash Rate"]} colors={["steelBlue", "darkgoldenrod"]}/>
        <AreaChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYStackedHashRate} unit="hashes/s" title={["Block Hash Rate", "Total Hash Rate"]} colors={["steelBlue", "darkgoldenrod"]}/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYPeers} title={["Peers"]}/>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);