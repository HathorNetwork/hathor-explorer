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
import VersionError from './screens/VersionError';
import WebSocketHandler from './WebSocketHandler';
import NanoContractsCreate from './screens/NanoContractsCreate';
import NanoContractsDecode from './screens/NanoContractsDecode';
import NanoContractsExecute from './screens/NanoContractsExecute';
import { dashboardUpdate, isVersionAllowedUpdate } from "./actions/index";
import { connect } from "react-redux";
import versionApi from './api/version';
import helpers from './utils/helpers';


const mapDispatchToProps = dispatch => {
  return {
    dashboardUpdate: data => dispatch(dashboardUpdate(data)),
    isVersionAllowedUpdate: data => dispatch(isVersionAllowedUpdate(data)),
  };
};


const mapStateToProps = (state) => {
  return { isVersionAllowed: state.isVersionAllowed };
};


class Root extends React.Component {
  componentDidMount() {
    WebSocketHandler.on('dashboard', this.handleWebsocket);

    versionApi.getVersion().then((data) => {
      this.props.isVersionAllowedUpdate({allowed: helpers.isVersionAllowed(data.version)});
    }, (e) => {
      // Error in request
      console.log(e);
    });
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
    this.props.dashboardUpdate({ ...data });
  }

  render() {
    if (this.props.isVersionAllowed === undefined) {
      // Waiting for version
      return null;
    } else if (!this.props.isVersionAllowed) {
      return <VersionError />;
    } else {
      return (
      <Router>
        <Switch>
          <NavigationRoute exact path="/wallet/send_tokens" component={SendTokens} />
          <NavigationRoute exact path="/wallet" component={Wallet} />
          <NavigationRoute exact path="/wallet/nano-contracts" component={NanoContractsDecode} />
          <NavigationRoute exact path="/wallet/nano-contracts-create" component={NanoContractsCreate} />
          <NavigationRoute exact path="/wallet/nano-contracts-execute" component={NanoContractsExecute} />
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
}

const NavigationRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
      <div><Navigation {...props}/><Component {...props} /></div>
  )} />
)

export default connect(mapStateToProps, mapDispatchToProps)(Root);
