import React from 'react';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import PeerAdmin from './screens/PeerAdmin';
import Wallet from './screens/Wallet';
import SendTokens from './screens/SendTokens';
import Navigation from './components/Navigation';
import TransactionDetail from './screens/TransactionDetail';
import DecodeTx from './screens/DecodeTx';
import PushTx from './screens/PushTx';

class Root extends React.Component {
  render() {
    return (
    <Router>
      <Switch>
        <NavigationRoute exact path="/wallet/send_tokens" component={SendTokens} />
        <NavigationRoute exact path="/wallet" component={Wallet} />
        <NavigationRoute exact path="/transaction/:id" component={TransactionDetail} />
        <NavigationRoute exact path="/push-tx" component={PushTx} />
        <NavigationRoute exact path="/decode-tx" component={DecodeTx} />
        <NavigationRoute exact path="" component={PeerAdmin} />
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

export default Root;
