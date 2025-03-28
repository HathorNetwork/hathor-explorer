/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback, useEffect } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { axios as hathorLibAxios, config as hathorLibConfig } from '@hathor/wallet-lib';
import { useTheme, useNewUiLoad } from './hooks';
import GDPRConsent from './components/GDPRConsent';
import Loading from './components/Loading';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
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
import ErrorMessage from './components/error/ErrorMessage';
import WebSocketHandler from './WebSocketHandler';
import NanoContractDetail from './screens/nano/NanoContractDetail';
import BlueprintDetail from './screens/nano/BlueprintDetail';
import BlueprintList from './screens/nano/BlueprintList';
import NanoContractsList from './screens/nano/NanoContractsList';
import {
  apiLoadErrorUpdate,
  dashboardUpdate,
  isVersionAllowedUpdate,
  updateServerInfo,
} from './store/rootSlice';
import versionApi from './api/version';
import helpers from './utils/helpers';
import { BASE_URL } from './constants';
import createRequestInstance from './api/customAxiosInstance';

hathorLibConfig.setServerUrl(BASE_URL);

const NavigationRoute = ({ internalScreen: InternalScreen }) => {
  return (
    <div className="limit-section">
      <Navigation />
      <div style={{ flex: 1 }}>
        <InternalScreen />
      </div>
      <Footer />
    </div>
  );
};

function Root() {
  useTheme();
  const dispatch = useDispatch();
  const isVersionAllowed = useSelector(state => state.isVersionAllowed);
  const apiLoadError = useSelector(state => state.apiLoadError);
  const newUiLoading = useNewUiLoad();

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
      <BrowserRouter>
        <>
          <Navigation />
          {apiLoadError ? <ErrorMessage /> : <Loading />}
        </>
      </BrowserRouter>
    );
  }

  if (!isVersionAllowed) {
    return <VersionError />;
  }

  if (newUiLoading) {
    return <Loading />;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/transaction/:id"
            element={<NavigationRoute internalScreen={TransactionDetail} />}
          />
          <Route path="/push-tx" element={<NavigationRoute internalScreen={PushTx} />} />
          <Route path="/decode-tx" element={<NavigationRoute internalScreen={DecodeTx} />} />
          <Route
            path="/transactions"
            element={<NavigationRoute internalScreen={TransactionList} />}
          />
          <Route path="/tokens" element={<NavigationRoute internalScreen={TokenList} />} />
          <Route
            path="/token_balances"
            element={<NavigationRoute internalScreen={TokenBalancesList} />}
          />
          <Route path="/blocks" element={<NavigationRoute internalScreen={BlockList} />} />
          <Route path="/dag" component={Dag} element={<NavigationRoute internalScreen={Dag} />} />
          <Route path="/features" element={<NavigationRoute internalScreen={FeatureList} />} />
          <Route
            path="/network/:peerId?"
            element={<NavigationRoute internalScreen={PeerAdmin} />}
          />
          <Route path="/statistics" element={<NavigationRoute internalScreen={Dashboard} />} />
          <Route
            path="/token_detail/:tokenUID"
            element={<NavigationRoute internalScreen={TokenDetail} />}
          />
          <Route
            path="/address/:address"
            element={<NavigationRoute internalScreen={AddressDetail} />}
          />
          <Route
            path="/nano_contract/detail/:nc_id"
            component={NanoContractDetail}
            element={<NavigationRoute internalScreen={NanoContractDetail} />}
          />
          <Route
            path="/blueprint/detail/:blueprint_id"
            element={<NavigationRoute internalScreen={BlueprintDetail} />}
          />
          <Route path="/blueprints/" element={<NavigationRoute internalScreen={BlueprintList} />} />
          <Route
            path="/nano_contracts/"
            element={<NavigationRoute internalScreen={NanoContractsList} />}
          />
          <Route path="" element={<NavigationRoute internalScreen={DashboardTx} />} />
        </Routes>
      </BrowserRouter>
      <GDPRConsent />
    </>
  );
}

export default Root;
