import React from 'react';
import { connect } from "react-redux";


const mapStateToProps = (state) => {
  return { transactions: state.transactions, blocks: state.blocks };
};


class Dashboard extends React.Component {

  render() {
    return (
      <div className="content-wrapper">
        <p>Txs: {this.props.transactions}</p>
        <p>Blocks: {this.props.blocks}</p>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);