/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect } from 'react';

import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { axios as hathorLibAxios, config as hathorLibConfig } from '@hathor/wallet-lib';
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
import versionApi from './api/version';
import helpers from './utils/helpers';
import { BASE_URL } from './constants';
import createRequestInstance from './api/customAxiosInstance';

hathorLibConfig.setServerUrl(BASE_URL);

const NavigationRoute = ({ internalScreen: InternalScreen }) => (
  <div>
    <Navigation />
    <InternalScreen />
  </div>
);

function Root() {
  const dispatch = useDispatch();
  const isVersionAllowed = useSelector(state => state.isVersionAllowed);
  const apiLoadError = useSelector(state => state.apiLoadError);

  const handleWebsocket = useCallback(
    wsData => {
      if (wsData.type === 'dashboard:metrics') {
        dispatch(dashboardUpdate({ ...wsData }));
      }
    },
    [dispatch]
  );

  // Screen initialization
  useEffect(() => {
    WebSocketHandler.on('dashboard', handleWebsocket);

    hathorLibAxios.registerNewCreateRequestInstance(createRequestInstance);
    dispatch(apiLoadErrorUpdate({ apiLoadError: false }));

    versionApi
      .getVersion()
      .then(data => {
        const network = data.network.includes('testnet') ? 'testnet' : data.network;
        hathorLibConfig.setNetwork(network);
        dispatch(updateServerInfo(data));
        dispatch(isVersionAllowedUpdate({ allowed: helpers.isVersionAllowed(data.version) }));
      })
      .catch(e => {
        // Error in request
        console.log(e);
        dispatch(apiLoadErrorUpdate({ apiLoadError: true }));
      });

    return () => {
      WebSocketHandler.removeListener('dashboard', handleWebsocket);
    };
  }, [dispatch, handleWebsocket]);

  if (isVersionAllowed === undefined) {
    // Waiting for version
    return (
      <Router>
        <>
          <Navigation />
          {apiLoadError ? (
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
  }

  if (!isVersionAllowed) {
    return <VersionError />;
  }

  return (
    <>
      <Router>
        <Switch>
          <Route exact path="/transaction/:id">
            <NavigationRoute internalScreen={TransactionDetail} />
          </Route>
          <Route exact path="/push-tx">
            <NavigationRoute internalScreen={PushTx} />
          </Route>
          <Route exact path="/decode-tx">
            <NavigationRoute internalScreen={DecodeTx} />
          </Route>
          <Route exact path="/transactions">
            <NavigationRoute internalScreen={TransactionList} />
          </Route>
          <Route exact path="/tokens">
            <NavigationRoute internalScreen={TokenList} />
          </Route>
          <Route exact path="/token_balances">
            <NavigationRoute internalScreen={TokenBalancesList} />
          </Route>
          <Route exact path="/token_balances">
            <NavigationRoute internalScreen={TokenBalancesList} />
          </Route>
          <Route exact path="/blocks">
            <NavigationRoute internalScreen={BlockList} />
          </Route>
          <Route exact path="/dag" component={Dag}>
            <NavigationRoute internalScreen={Dag} />
          </Route>
          <Route exact path="/features">
            <NavigationRoute internalScreen={FeatureList} />
          </Route>
          <Route exact path="/network/:peerId?">
            <NavigationRoute internalScreen={PeerAdmin} />
          </Route>
          <Route exact path="/statistics">
            <NavigationRoute internalScreen={Dashboard} />
          </Route>
          <Route exact path="/token_detail/:tokenUID">
            <NavigationRoute internalScreen={TokenDetail} />
          </Route>
          <Route exact path="/address/:address">
            <NavigationRoute internalScreen={AddressDetail} />
          </Route>
          <Route exact path="/nano_contract/detail/:nc_id" component={NanoContractDetail}>
            <NavigationRoute internalScreen={NanoContractDetail} />
          </Route>
          <Route exact path="/blueprint/detail/:blueprint_id">
            <NavigationRoute internalScreen={BlueprintDetail} />
          </Route>
          <Route exact path="">
            <NavigationRoute internalScreen={DashboardTx} />
          </Route>
        </Switch>
      </Router>
      <GDPRConsent />
    </>
  );
}

export default Root;
