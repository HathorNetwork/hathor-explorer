import React from 'react';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import PeerAdmin from './screens/PeerAdmin';
import DashboardTx from './screens/DashboardTx';
import Wallet from './screens/Wallet';
import SendTokens from './screens/SendTokens';
import Navigation from './components/Navigation';
import TransactionDetail from './screens/TransactionDetail';
import DecodeTx from './screens/DecodeTx';
import PushTx from './screens/PushTx';
import TransactionList from './screens/TransactionList';
import BlockList from './screens/BlockList';
import Dag from './screens/Dag';
import Dashboard from './screens/Dashboard';
import WebSocketHandler from './WebSocketHandler';
import { dashboardUpdate } from "./actions/index";
import { connect } from "react-redux";


const mapDispatchToProps = dispatch => {
  return {
    dashboardUpdate: data => dispatch(dashboardUpdate(data))
  };
};


class Root extends React.Component {
  componentDidMount() {
    WebSocketHandler.on('dashboard', this.handleWebsocket);
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('dashboard', this.handleWebsocket);
  }

  handleWebsocket = (wsData) => {
    if (wsData.type === 'dashboard:metrics') {
      this.updateWithWs(wsData);
    }
  }

  updateWithWs = (data) => {
    this.props.dashboardUpdate({ transactions: data.transactions, blocks: data.blocks });
  }

  render() {
    return (
    <Router>
      <Switch>
        <NavigationRoute exact path="/wallet/send_tokens" component={SendTokens} />
        <NavigationRoute exact path="/wallet" component={Wallet} />
        <NavigationRoute exact path="/transaction/:id" component={TransactionDetail} />
        <NavigationRoute exact path="/push-tx" component={PushTx} />
        <NavigationRoute exact path="/decode-tx" component={DecodeTx} />
        <NavigationRoute exact path="/dashboard-tx" component={DashboardTx} />
        <NavigationRoute exact path="/transactions" component={TransactionList} />
        <NavigationRoute exact path="/blocks" component={BlockList} />
        <NavigationRoute exact path="/dag" component={Dag} />
        <NavigationRoute exact path="/network" component={PeerAdmin} />
        <NavigationRoute exact path="" component={Dashboard} />
      </Switch>
    </Router>
    )
  }
}

const NavigationRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
      <div><Navigation {...props}/><Component {...props} /></div>
  )} />
)

export default connect(null, mapDispatchToProps)(Root);
