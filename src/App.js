import React from 'react';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import Admin from './components/Admin';
import Wallet from './components/Wallet';
import Navigation from './components/Navigation';

class Root extends React.Component {
  render() {
    return (
    <Router>
      <Switch>
        <NavigationRoute exact path="/wallet" component={Wallet} />
        <NavigationRoute exact path="" component={Admin} />
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
