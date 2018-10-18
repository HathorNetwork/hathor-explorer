import React from 'react';
import { connect } from "react-redux";
import LineChartRealTime from '../components/LineChartRealTime';


const mapStateToProps = (state) => {
  return { data: state.data };
};


class Dashboard extends React.Component {
  getXData(d) {
    return d.date;
  }

  getYTxRate(d) {
    return d.txRate.toFixed(2);
  }

  getYTx(d) {
    return d.transactions;
  }

  getYBlock(d) {
    return d.blocks;
  }

  getYHashRate(d) {
    return d.hash_rate.toFixed(2);
  }

  getYPeers(d) {
    return d.peers;
  }

  render() {
    return (
      <div className="content-wrapper">
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTxRate} unit="tx/s" title="Tx Rate"/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTx} title="Transactions" />
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYBlock} title="Blocks"/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYHashRate} unit="hashes/s" title="Hash Rate"/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYPeers} title="Peers"/>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);