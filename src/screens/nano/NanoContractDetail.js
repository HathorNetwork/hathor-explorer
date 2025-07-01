/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import hathorLib from '@hathor/wallet-lib';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NanoContractHistory from '../../components/nano/NanoContractHistory';
import Loading from '../../components/Loading';
import nanoApi from '../../api/nanoApi';
import txApi from '../../api/txApi';

/**
 * Details of a Nano Contract
 *
 * @memberof Screens
 */
function NanoContractDetail() {
  const { nc_id: ncId } = useParams();

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
        if (transactionData.tx.nc_id === undefined) {
          if (ignore) {
            // This is to prevent setting a state after the component has been already cleaned
            return;
          }
          setErrorMessage('Transaction is not a nano contract.');
          return;
        }

        const blueprintInformationData = await nanoApi.getBlueprintInformation(
          transactionData.tx.nc_blueprint_id
        );
        const dataState = await nanoApi.getState(
          ncId,
          Object.keys(blueprintInformationData.attributes),
          ['__all__'],
          []
        );
        if (ignore) {
          // This is to prevent setting a state after the componenet has been already cleaned
          return;
        }
        setBlueprintInformation(blueprintInformationData);
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
        <td>{data.can_mint ? 'Yes' : 'No'}</td>
        <td>{data.can_melt ? 'Yes' : 'No'}</td>
      </tr>
    ));
  };

  const renderNewUiNCBalances = () => (
    <div className="table-responsive blueprint-balance-table">
      <table className="table-stylized" id="balance-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Amount</th>
            <th>Can mint</th>
            <th>Can melt</th>
          </tr>
        </thead>
        <tbody>{renderBalances()}</tbody>
      </table>
    </div>
  );

  const renderNewUiAttributes = () => (
    <div className="table-responsive blueprint-attributes-table">
      <table className="table-stylized" id="attributes-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value (or Type)</th>
          </tr>
        </thead>
        <tbody>{renderAttributes()}</tbody>
      </table>
    </div>
  );

  const renderAttributeValue = (name, data) => {
    // If the attribute is a dict, it won't return the value of it
    // it will return an error message {errmsg: 'field not found'}
    // In this case, we will show only the attribute type
    // In the future, we plan to have a query feature, so the user can
    // query these attributes until they get the value they need
    if (!('value' in data)) {
      // If the value is a dict, we show only the type for now
      return blueprintInformation.attributes[name];
    }

    if (data.value == null) {
      // If value is null or undefined, we show empty string
      return null;
    }

    // Get type of value but removing possible optional mark (?) to format the value correctly
    const type = blueprintInformation.attributes[name].replace('?', '');

    if (type === 'Timestamp') {
      return hathorLib.dateUtils.parseTimestamp(data.value);
    }

    if (type === 'Amount') {
      return hathorLib.numberUtils.prettyValue(data.value, decimalPlaces);
    }

    return data.value;
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

  const renderNewUi = () => (
    <div className="blueprint-content-wrapper">
      <h3>Nano Contract Detail</h3>
      <p className="blueprint-id-name-info">
        <strong style={{ whiteSpace: 'nowrap' }}>NANO CONTRACT ID: </strong>
        <span>{ncId}</span>
      </p>
      <p className="blueprint-id-name-info">
        <strong>BLUEPRINT: </strong>
        <span>
          <span>{ncState.blueprint_name}</span>(
          <Link to={`/blueprint/detail/${txData.nc_blueprint_id}`}>{txData.nc_blueprint_id}</Link>)
        </span>
      </p>
      <div className="blueprint-attributes">
        <h4>Attributes</h4>
        {renderNewUiAttributes()}
      </div>
      <div className="blueprint-attributes">
        <h4>Balances</h4>
        {renderNewUiNCBalances()}
      </div>
      <div className="nano-history">
        <h3>History</h3>
        <NanoContractHistory ncId={ncId} />
      </div>
    </div>
  );

  return renderNewUi();
}

export default NanoContractDetail;
