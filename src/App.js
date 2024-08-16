/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import GDPRConsent from './components/GDPRConsent';
import Loading from './components/Loading';
import Navigation from './components/Navigation';
import PeerAdmin from './screens/PeerAdmin';
import DashboardTx from './screens/DashboardTx';
import TransactionDetail from './screens/TransactionDetail';
import AddressDetail from './screens/AddressDetail';
import DecodeTx from './screens/DecodeTx';
import PushTx from './screens/PushTx';
import TransactionList from './screens/TransactionList';
import FeatureList from './screens/FeatureList';
import TokenList from './screens/TokenList';
import TokenBalancesList from './screens/TokenBalances';
import BlockList from './screens/BlockList';
import TokenDetail from './screens/TokenDetail';
import Dag from './screens/Dag';
import Dashboard from './screens/Dashboard';
import VersionError from './screens/VersionError';
import WebSocketHandler from './WebSocketHandler';
import NanoContractDetail from './screens/nano/NanoContractDetail';
import BlueprintDetail from './screens/nano/BlueprintDetail';
import {
  apiLoadErrorUpdate,
  dashboardUpdate,
  isVersionAllowedUpdate,
  updateServerInfo,
} from './actions/index';
import { connect } from 'react-redux';
import versionApi from './api/version';
import helpers from './utils/helpers';
import { axios as hathorLibAxios, config as hathorLibConfig } from '@hathor/wallet-lib';
import { BASE_URL } from './constants';
import createRequestInstance from './api/customAxiosInstance';

hathorLibConfig.setServerUrl(BASE_URL);

const mapDispatchToProps = dispatch => {
  return {
    dashboardUpdate: data => dispatch(dashboardUpdate(data)),
    isVersionAllowedUpdate: data => dispatch(isVersionAllowedUpdate(data)),
    apiLoadErrorUpdate: data => dispatch(apiLoadErrorUpdate(data)),
    updateServerInfo: data => dispatch(updateServerInfo(data)),
  };
};

const mapStateToProps = state => {
  return { isVersionAllowed: state.isVersionAllowed, apiLoadError: state.apiLoadError };
};

class Root extends React.Component {
  componentDidMount() {
    WebSocketHandler.on('dashboard', this.handleWebsocket);

    hathorLibAxios.registerNewCreateRequestInstance(createRequestInstance);
    this.props.apiLoadErrorUpdate({ apiLoadError: false });

    versionApi.getVersion().then(
      data => {
        let network = data.network;
        if (data.network.includes('testnet')) {
          network = 'testnet';
        }
        hathorLibConfig.setNetwork(network);
        this.props.updateServerInfo(data);
        this.props.isVersionAllowedUpdate({ allowed: helpers.isVersionAllowed(data.version) });
      },
      e => {
        // Error in request
        console.log(e);
        this.props.apiLoadErrorUpdate({ apiLoadError: true });
      }
    );
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('dashboard', this.handleWebsocket);
  }

  handleWebsocket = wsData => {
    if (wsData.type === 'dashboard:metrics') {
      this.updateWithWs(wsData);
    }
  };

  updateWithWs = data => {
    this.props.dashboardUpdate({ ...data });
  };

  render() {
    if (this.props.isVersionAllowed === undefined) {
      // Waiting for version
      return (
        <Router>
          <>
            <Navigation />
            {this.props.apiLoadError ? (
              <div className="content-wrapper">
                <h3 className="text-danger">
                  Error loading the explorer. Please reload the page to try again.
                </h3>
              </div>
            ) : (
              <Loading />
            )}
          </>
        </Router>
      );
    } else if (!this.props.isVersionAllowed) {
      return <VersionError />;
    } else {
      return (
        <>
          <Router>
            <Switch>
              <NavigationRoute exact path="/transaction/:id" component={TransactionDetail} />
              <NavigationRoute exact path="/push-tx" component={PushTx} />
              <NavigationRoute exact path="/decode-tx" component={DecodeTx} />
              <NavigationRoute exact path="/transactions" component={TransactionList} />
              <NavigationRoute exact path="/tokens" component={TokenList} />
              <NavigationRoute exact path="/token_balances" component={TokenBalancesList} />
              <NavigationRoute exact path="/blocks" component={BlockList} />
              <NavigationRoute exact path="/dag" component={Dag} />
              <NavigationRoute exact path="/features" component={FeatureList} />
              <NavigationRoute exact path="/network/:peerId?" component={PeerAdmin} />
              <NavigationRoute exact path="/statistics" component={Dashboard} />
              <NavigationRoute exact path="/token_detail/:tokenUID" component={TokenDetail} />
              <NavigationRoute exact path="/address/:address" component={AddressDetail} />
              <NavigationRoute
                exact
                path="/nano_contract/detail/:nc_id"
                component={NanoContractDetail}
              />
              <NavigationRoute
                exact
                path="/blueprint/detail/:blueprint_id"
                component={BlueprintDetail}
              />
              <NavigationRoute exact path="" component={DashboardTx} />
            </Switch>
          </Router>
          <GDPRConsent />
        </>
      );
    }
  }
}

const NavigationRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      <div>
        <Navigation {...props} />
        <Component {...props} />
      </div>
    )}
  />
);

export default connect(mapStateToProps, mapDispatchToProps)(Root);
