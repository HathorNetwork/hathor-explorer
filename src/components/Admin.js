import React from 'react';
import Network from './Network';
import Transactions from './Transactions';


class Admin extends React.Component {
  render() {
    return (
      <div className="content-wrapper">
        <ul className="nav nav-tabs" id="adminTab" role="tablist">
          <li className="nav-item">
            <a className="nav-link active" id="network-tab" data-toggle="tab" href="#network" role="tab" aria-controls="network" aria-selected="true">Network</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" id="transactions-tab" data-toggle="tab" href="#transactions" role="tab" aria-controls="transactions" aria-selected="false">Transactions</a>
          </li>
        </ul>
        <div className="tab-content" id="adminTabContent">
          <div className="tab-pane fade show active" id="network" role="tabpanel" aria-labelledby="network-tab">{<Network />}</div>
          <div className="tab-pane fade" id="transactions" role="tabpanel" aria-labelledby="transactions-tab">{<Transactions />}</div>
        </div>
      </div>
    );
  }
}

export default Admin;