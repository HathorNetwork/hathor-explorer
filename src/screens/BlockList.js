import React from 'react';
import Transactions from '../components/Transactions';


class BlockList extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <Transactions type="block" />
      </div>
    );
  }
}

export default BlockList;
