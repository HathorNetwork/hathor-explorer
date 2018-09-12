import React from 'react';
import Network from '../components/Network';
import Transactions from '../components/Transactions';


class TransactionList extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <Transactions />
      </div>
    );
  }
}

export default TransactionList;