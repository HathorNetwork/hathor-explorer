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
    return d.txRate;
  }

  getYTx(d) {
    return d.transactions;
  }

  getYBlock(d) {
    return d.blocks;
  }

  render() {
    return (
      <div className="content-wrapper">
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTxRate} title="Tx Rate"/>
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYTx} title="Transactions" />
        <LineChartRealTime data={this.props.data} getX={this.getXData} getY={this.getYBlock} title="Blocks"/>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);