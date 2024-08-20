/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import NanoContractHistory from '../../components/nano/NanoContractHistory';
import hathorLib from '@hathor/wallet-lib';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../../components/Loading';
import nanoApi from '../../api/nanoApi';
import txApi from '../../api/txApi';

/**
 * Details of a Nano Contract
 *
 * @memberof Screens
 */
function NanoContractDetail(props) {
  const ncId = props.match.params.nc_id;

  // ncState {Object | null} Nano contract state
  const [ncState, setNcState] = useState(null);
  // blueprintInformation {Object | null} Blueprint Information from API
  const [blueprintInformation, setBlueprintInformation] = useState(null);
  // txData {Object | null} Nano contract transaction data
  const [txData, setTxData] = useState(null);
  // loadingDetail {boolean} Bool to show/hide loading when getting transaction detail
  const [loadingDetail, setLoadingDetail] = useState(true);
  // errorMessage {string | null} Error message in case a request to get nano contract data fails
  const [errorMessage, setErrorMessage] = useState(null);

  const { decimalPlaces } = useSelector(state => {
    return { decimalPlaces: state.serverInfo.decimal_places };
  });

  useEffect(() => {
    let ignore = false;

    async function loadBlueprintInformation() {
      setLoadingDetail(true);
      setNcState(null);
      setTxData(null);
      try {
        const transactionData = await txApi.getTransaction(ncId);
        if (transactionData.tx.version !== hathorLib.constants.NANO_CONTRACTS_VERSION) {
          if (ignore) {
            // This is to prevent setting a state after the component has been already cleaned
            return;
          }
          setErrorMessage('Transaction is not a nano contract.');
          return;
        }

        const blueprintInformation = await nanoApi.getBlueprintInformation(
          transactionData.tx.nc_blueprint_id
        );
        const dataState = await nanoApi.getState(
          ncId,
          Object.keys(blueprintInformation.attributes),
          ['__all__'],
          []
        );
        if (ignore) {
          // This is to prevent setting a state after the componenet has been already cleaned
          return;
        }
        setBlueprintInformation(blueprintInformation);
        setNcState(dataState);
        setTxData(transactionData.tx);
        setLoadingDetail(false);
      } catch (e) {
        if (ignore) {
          // This is to prevent setting a state after the componenet has been already cleaned
          return;
        }
        setErrorMessage('Error getting nano contract state.');
        setLoadingDetail(false);
      }
    }

    loadBlueprintInformation();

    return () => {
      ignore = true;
    };
  }, [ncId]);

  if (errorMessage) {
    return <p className="text-danger mb-4">{errorMessage}</p>;
  }

  if (loadingDetail) {
    return <Loading />;
  }

  const renderBalances = () => {
    return Object.entries(ncState.balances).map(([tokenUid, data]) => (
      <tr key={tokenUid}>
        <td>
          {tokenUid === hathorLib.constants.NATIVE_TOKEN_UID ? (
            tokenUid
          ) : (
            <Link to={`/token_detail/${tokenUid}`}>{tokenUid}</Link>
          )}
        </td>
        <td>{hathorLib.numberUtils.prettyValue(data.value, decimalPlaces)}</td>
      </tr>
    ));
  };

  const renderNCBalances = () => {
    return (
      <div className="table-responsive">
        <table className="table table-striped table-bordered" id="attributes-table">
          <thead>
            <tr>
              <th className="d-lg-table-cell">Token</th>
              <th className="d-lg-table-cell">Amount</th>
            </tr>
          </thead>
          <tbody>{renderBalances()}</tbody>
        </table>
      </div>
    );
  };

  const renderNCAttributes = () => {
    return (
      <div className="table-responsive">
        <table className="table table-striped table-bordered" id="attributes-table">
          <thead>
            <tr>
              <th className="d-lg-table-cell">Name</th>
              <th className="d-lg-table-cell">Value (or Type)</th>
            </tr>
          </thead>
          <tbody>{renderAttributes()}</tbody>
        </table>
      </div>
    );
  };

  const renderAttributeValue = (name, data) => {
    // If the attribute is a dict, it won't return the value of it
    // it will return an error message {errmsg: 'field not found'}
    // In this case, we will show only the attribute type
    // In the future, we plan to have a query feature, so the user can
    // query these attributes until they get the value they need
    return 'value' in data ? data.value : blueprintInformation.attributes[name];
  };

  const renderAttributes = () => {
    return Object.entries(ncState.fields).map(([name, data]) => {
      return (
        <tr key={name}>
          <td>{name}</td>
          <td>{renderAttributeValue(name, data)}</td>
        </tr>
      );
    });
  };
  return (
    <div className="content-wrapper">
      <h3 className="mt-4">Nano Contract Detail</h3>
      <div className="mt-5">
        <p>
          <strong>Nano Contract ID: </strong>
          {ncId}
        </p>
        <p>
          <strong>Blueprint: </strong>
          {ncState.blueprint_name} (
          <Link to={`/blueprint/detail/${txData.nc_blueprint_id}`}>{txData.nc_blueprint_id}</Link>)
        </p>
        <h4 className="mt-5 mb-4">Attributes</h4>
        {renderNCAttributes()}
        <h4 className="mt-3 mb-4">Balances</h4>
        {renderNCBalances()}
        <hr />
        <h3 className="mt-4">History</h3>
        <NanoContractHistory ncId={ncId} />
      </div>
    </div>
  );
}

export default NanoContractDetail;
