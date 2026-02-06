/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import hathorLib from '@hathor/wallet-lib';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import NanoContractHistory from '../../components/nano/NanoContractHistory';
import Loading from '../../components/Loading';
import nanoApi from '../../api/nanoApi';
import PaginationURL from '../../utils/pagination';
import HathorSnackbar from '../../components/HathorSnackbar';
import { ReactComponent as CopyIcon } from '../../assets/images/copy-icon.svg';

const TabType = Object.freeze({
  ATTRIBUTES: 'attributes',
  BALANCES: 'balances',
  HISTORY: 'history',
});

/**
 * Details of a Nano Contract
 *
 * @memberof Screens
 */
function NanoContractDetail() {
  const { nc_id: ncId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination utility for URL-based tab state
  const pagination = useMemo(
    () =>
      new PaginationURL({
        tab: { required: false, defaultValue: TabType.HISTORY },
      }),
    []
  );

  // ncState {Object | null} Nano contract state
  const [ncState, setNcState] = useState(null);
  // blueprintInformation {Object | null} Blueprint Information from API
  const [blueprintInformation, setBlueprintInformation] = useState(null);
  // loadingDetail {boolean} Bool to show/hide loading when getting transaction detail
  const [loadingDetail, setLoadingDetail] = useState(true);
  // errorMessage {string | null} Error message in case a request to get nano contract data fails
  const [errorMessage, setErrorMessage] = useState(null);
  // activeTab {string} Currently active tab
  const [activeTab, setActiveTab] = useState(TabType.HISTORY);

  const snackbarRef = useRef(null);

  const { decimalPlaces } = useSelector(state => {
    return { decimalPlaces: state.serverInfo.decimal_places };
  });

  /**
   * Handle tab initialization from URL
   */
  const handleTabFromURL = useCallback(() => {
    const queryParams = pagination.obtainQueryParams();
    if (queryParams.tab) {
      setActiveTab(queryParams.tab);
    }
  }, [pagination]);

  /**
   * When the user clicks a tab, update the URL
   *
   * @param {string} tab The tab that was clicked
   */
  const onTabClicked = tab => {
    const newURL = pagination.setURLParameters({ tab });
    navigate(newURL);
  };

  /**
   * Called when contract ID is copied to clipboard
   */
  const copied = (_text, result) => {
    if (result) {
      snackbarRef.current.show(3000);
    }
  };

  // Initialize tab from URL when location changes
  useEffect(() => {
    handleTabFromURL();
  }, [location, handleTabFromURL]);

  useEffect(() => {
    let ignore = false;

    async function loadBlueprintInformation() {
      setLoadingDetail(true);
      setNcState(null);
      try {
        // This screen need the contract to be already confirmed by a block
        // so we can get its state, so we can use the state API directly to get
        // the blueprintID
        const auxState = await nanoApi.getState(ncId, [], [], []);

        const blueprintInformationData = await nanoApi.getBlueprintInformation(
          auxState.blueprint_id
        );
        const dataState = await nanoApi.getState(
          ncId,
          Object.keys(blueprintInformationData.attributes),
          ['__all__'],
          []
        );
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
          return;
        }
        setBlueprintInformation(blueprintInformationData);
        setNcState(dataState);
        setLoadingDetail(false);
      } catch (e) {
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
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
      <table className="table-stylized table-no-hover" id="balance-table">
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
      <table className="table-stylized table-no-hover" id="attributes-table">
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

  const renderTabs = () => (
    <div className="filter-container d-flex flex-row justify-content-between">
      <div className="tabs-container d-flex flex-row">
        <div
          className={`tab ${activeTab === TabType.HISTORY && 'active'}`}
          onClick={() => onTabClicked(TabType.HISTORY)}
        >
          History
        </div>
        <div
          className={`tab ${activeTab === TabType.ATTRIBUTES && 'active'}`}
          onClick={() => onTabClicked(TabType.ATTRIBUTES)}
        >
          Attributes
        </div>
        <div
          className={`tab ${activeTab === TabType.BALANCES && 'active'}`}
          onClick={() => onTabClicked(TabType.BALANCES)}
        >
          Balances
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === TabType.ATTRIBUTES) {
      return <div className="blueprint-attributes">{renderNewUiAttributes()}</div>;
    }

    if (activeTab === TabType.BALANCES) {
      return <div className="blueprint-attributes">{renderNewUiNCBalances()}</div>;
    }

    if (activeTab === TabType.HISTORY) {
      return (
        <div className="nano-history">
          <NanoContractHistory ncId={ncId} />
        </div>
      );
    }

    return null;
  };

  const renderNewUi = () => (
    <div className="blueprint-content-wrapper">
      <h3>Nano Contract Detail</h3>
      <p className="blueprint-id-name-info" style={{ marginBottom: '8px' }}>
        <strong style={{ whiteSpace: 'nowrap' }}>NANO CONTRACT ID: </strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{ncId}</span>
          <CopyToClipboard text={ncId} onCopy={copied}>
            <CopyIcon className="copy-icon-inline" style={{ cursor: 'pointer' }} />
          </CopyToClipboard>
        </span>
      </p>
      <p className="blueprint-id-name-info">
        <strong>BLUEPRINT: </strong>
        <span>
          <span>{ncState.blueprint_name}</span> (
          <Link to={`/blueprint/detail/${blueprintInformation.id}`}>{blueprintInformation.id}</Link>
          )
        </span>
      </p>
      {renderTabs()}
      {renderTabContent()}
      <HathorSnackbar ref={snackbarRef} text="Copied to clipboard!" type="success" />
    </div>
  );

  return renderNewUi();
}

export default NanoContractDetail;
