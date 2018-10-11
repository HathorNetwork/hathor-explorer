import React from 'react';
import { connect } from "react-redux";
import LineChartRealTime from '../components/LineChartRealTime';


const mapStateToProps = (state) => {
  return { data: state.data };
};


class Dashboard extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <LineChartRealTime data={this.props.data} dataKey="txRate" title="Tx Rate"/>
        <LineChartRealTime data={this.props.data} dataKey="transactions" title="Transactions" />
        <LineChartRealTime data={this.props.data} dataKey="blocks" title="Blocks"/>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);