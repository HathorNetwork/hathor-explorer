import React from 'react';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import Admin from './components/Admin';

class Root extends React.Component {
  render() {
    return (
    <Router>
      <Switch>
        <Route exact path="" component={Admin} />
      </Switch>
    </Router>
    )
  }
}

export default Root;
